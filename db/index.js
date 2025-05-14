import mysql from "mysql2/promise";
import express from "express";
import cors from "cors";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: 
});

const app = express();
const port = 4000;
const dbs = ["mysql"];

app.use(express.json());
app.use(cors());

const verifyDB = async (connection) => {
  const [tables] = await connection.execute(`
    SELECT TABLE_NAME 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_SCHEMA = DATABASE();
  `);

  const schema = [];
  for (const table of tables) {
    const tableName = table.TABLE_NAME;
    const [columns] = await connection.execute(
      `
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY, EXTRA 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = ? AND TABLE_SCHEMA = DATABASE();
      `,
      [tableName]
    );

    schema.push({
      table: tableName,
      description: `La tabla '${tableName}' tiene ${columns.length} columnas.`,
      columns: columns.map((col) => ({
        name: col.COLUMN_NAME,
        type: col.DATA_TYPE,
        nullable: col.IS_NULLABLE === "YES",
        key: col.COLUMN_KEY,
        extra: col.EXTRA,
      })),
    });
  }
  return schema;
};

app.post("/check", async (req, res) => {
  if (!req.body)
    return res.status(400).json({ error: "NO_DATA", message: "No envió información en el body" });
  if (!req.body.type)
    return res.status(400).json({ error: "NO_TYPE", message: "No envió el tipo de base de datos" });
  if (!req.body.credentials)
    return res.status(400).json({ error: "NO_CREDENTIALS", message: "No envió las credenciales" });

  const { type, credentials } = req.body;

  if (!dbs.includes(type))
    return res.status(400).json({ error: "NO_TYPE_AVAILABLE", message: "El tipo de base de datos no está disponible" });

  try {
    const connection = await mysql.createConnection({
      host: credentials.host,
      user: credentials.user,
      password: credentials.password,
      database: credentials.db,
    });
    await connection.end();

    return res.json({
      success: true,
      message: "Conexión exitosa y esquema obtenido.",
    });
  } catch (err) {
    return res.status(400).json({ error: "ERROR_CONNECTION", message: "Hubo un error al conectar con la base de datos", details: err.message });
  }
});

app.post("/query", async (req, res) => {
  const { credentials, query } = req.body;

  if (!credentials)
    return res.status(400).json({ error: "NO_CREDENTIALS", message: "No envió las credenciales de conexión" });

  if (!query)
    return res.status(400).json({ error: "NO_QUERY", message: "No envió la consulta a ejecutar" });

  try {
    // Paso 1: Clasificación del tipo de mensaje
    const classify = await client.chat.completions.create({
      model: "o3-mini-2025-01-31",
      messages: [
        {
          role: "user",
          content: `Clasifica este mensaje: "${query}". Si es una consulta para base de datos, responde solo la palabra "consulta". Si no lo es (saludo, conversación, etc.), responde con cualquier otra cosa.`,
        },
      ],
    });

    const classification = classify.choices[0].message.content.trim().toLowerCase();

    // Paso 2: Si no es una consulta, responder con una respuesta amable
    if (classification !== "consulta") {
      const friendlyResponse = await client.chat.completions.create({
        model: "o3-mini-2025-01-31",
        messages: [
          {
            role: "user",
            content: query, // Se envía el mensaje tal cual para que sea respondido amigablemente
          },
        ],
      });

      const cleanData = friendlyResponse.choices[0].message.content.trim();

      return res.json({
        success: true,
        message: "Mensaje no clasificado como consulta",
        data: cleanData,
      });
    }

    // Paso 3: Si es una consulta, conectar a la base de datos
    const connection = await mysql.createConnection({
      host: credentials.credentials.host,
      user: credentials.credentials.user,
      password: credentials.credentials.password,
      database: credentials.credentials.db,
      multipleStatements: false,
    });

    const schema = await verifyDB(connection);
	console.log(schema)
    // Generar consulta SQL
    const completion = await client.chat.completions.create({
      model: "o3-mini-2025-01-31",
      messages: [
        {
          role: "user",
          content: `Según mi base de datos y teniendo en cuenta el contexto de ventas, que tiene el siguiente esquema: ${JSON.stringify(schema)}. 
          A continuación, te haré una consulta y quiero que me respondas con la consulta SQL exacta para obtener los datos, sin ningún formato adicional ni explicaciones. 
          La consulta debe ser un SELECT directo, y la respuesta debe ajustarse al tipo de datos solicitados. 
          Toma en cuenta que, si la consulta hace referencia a períodos como 'este mes' o 'esta semana', debes calcular correctamente las fechas en función de la fecha actual. 
          Además, si se solicita un cálculo, como 'gastos totales', 'ganancia' o 'pérdida', asegúrate de incluir los cálculos relevantes en la consulta. 
          Ten en cuenta los datos del esquema y las columnas correspondientes. 
          
          Aquí está la consulta que necesito: ${query}`,
        },
      ],
    });
    
    const newQuery = completion.choices[0].message.content;
    const cleanQuery = newQuery.replace(/```sql\s*|\s*```/g, "").trim();
    // Generar consulta SQL
    const completion1 = await client.chat.completions.create({
      model: "o3-mini-2025-01-31",
      messages: [
        {
          role: "user",
          content: `segun esta pregunta ${query} y mi esquema ${JSON.stringify(schema)}.  rectifica que la query responde adecuadamente si no, devuelveme unicamente la nueva query que si cumple con los requisitos de la pregunta, pero solo la query en formato sql nada de informacion ni recomendaciones la query unicamente de lo contrario devuelve la siguiente query: ${cleanQuery}`,
        },
      ],
    });
    
    const newQuery1 = completion1.choices[0].message.content;
    const cleanQuery1 = newQuery1.replace(/```sql\s*|\s*```/g, "").trim();
	console.log(newQuery1);
    const [results] = await connection.execute(cleanQuery1);
    await connection.end();

    // Formatear los datos en HTML
    const formatData = await client.chat.completions.create({
      model: "o3-mini-2025-01-31",
      messages: [
        {
          role: "user",
          content: `según estos datos: ${JSON.stringify(results)} 
          Responde a la siguiente pregunta formateada en html para que tenga una mejor comprensión, pero solo etiquetas html nada de doctype: ${query}`,
        },
      ],
    });

    const data = formatData.choices[0].message.content;
    const cleanData = data.replace(/```html\s*|\s*```/g, "").trim();

    return res.json({
      success: true,
      message: "Consulta ejecutada exitosamente",
      data: cleanData,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: "ERROR_QUERY",
      message: "Hubo un error al ejecutar la consulta",
      details: err.message,
    });
  }
});


// Solo iniciar el servidor si no estamos en modo de prueba
if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
  });
}

export { app };  // Exportamos `app` para usar en las pruebas
