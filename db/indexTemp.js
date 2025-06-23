import mysql from "mysql2/promise";
import express from "express";
import cors from "cors";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey:
    "",
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
    return res
      .status(400)
      .json({ error: "NO_DATA", message: "No envió información en el body" });
  if (!req.body.type)
    return res
      .status(400)
      .json({ error: "NO_TYPE", message: "No envió el tipo de base de datos" });
  if (!req.body.credentials)
    return res
      .status(400)
      .json({ error: "NO_CREDENTIALS", message: "No envió las credenciales" });

  const { type, credentials } = req.body;

  if (!dbs.includes(type))
    return res.status(400).json({
      error: "NO_TYPE_AVAILABLE",
      message: "El tipo de base de datos no está disponible",
    });

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
    return res.status(400).json({
      error: "ERROR_CONNECTION",
      message: "Hubo un error al conectar con la base de datos",
      details: err.message,
    });
  }
});

app.post("/query", async (req, res) => {
  const { credentials, query } = req.body;

  if (!credentials)
    return res.status(400).json({
      error: "NO_CREDENTIALS",
      message: "No envió las credenciales de conexión",
    });

  if (!query)
    return res.status(400).json({
      error: "NO_QUERY",
      message: "No envió la consulta a ejecutar",
    });

  try {
    // Conectar a la BD
    const connection = await mysql.createConnection({
      host: credentials.credentials.host,
      user: credentials.credentials.user,
      password: credentials.credentials.password,
      database: credentials.credentials.db,
      multipleStatements: false,
    });

    const schema = await verifyDB(connection);

    // ✅ 1. Clasificar y generar SQL en una sola llamada
    const response = await client.chat.completions.create({
      model: "o3-mini-2025-01-31",
      messages: [
        {
          role: "system",
          content: `Eres un asistente experto en SQL para aplicaciones de ventas.`,
        },
        {
          role: "user",
          content: `Teniendo en cuenta el siguiente esquema de base de datos: ${JSON.stringify(schema)} 
Clasifica el siguiente mensaje: "${query}". 
Si es una consulta relacionada con ventas que se puede responder con los datos del esquema, responde solo con la consulta SQL exacta (sin formato, sin explicaciones, sin etiquetas). 
Si no es una consulta válida, responde con "otro".`,
        },
      ],
    });

    const generated = response.choices[0].message.content.trim();

    if (generated.toLowerCase() === "otro") {
      // ⚠️ Si no es consulta, solo responde con IA amable
      const friendly = await client.chat.completions.create({
        model: "o3-mini-2025-01-31",
        messages: [{ role: "user", content: query }],
      });

      return res.json({
        success: true,
        message: "Mensaje no clasificado como consulta",
        data: friendly.choices[0].message.content.trim(),
      });
    }

    // ✅ 2. Ejecutar la consulta SQL directamente
    const cleanQuery = generated.replace(/```sql\s*|\s*```/g, "");
    console.log(cleanQuery)
    const [results] = await connection.execute(cleanQuery);
    await connection.end();

    // ✅ 3. Formatear respuesta en HTML (una sola llamada)
    const formatted = await client.chat.completions.create({
      model: "o3-mini-2025-01-31",
      messages: [
        {
          role: "user",
          content: `Con base en esta data: ${JSON.stringify(results)}, responde a esta pregunta de forma entendible en HTML únicamente (sin doctype): ${query}`,
        },
      ],
    });

    const html = formatted.choices[0].message.content.replace(/```html\s*|\s*```/g, "").trim();

    return res.json({
      success: true,
      message: "Consulta ejecutada exitosamente",
      data: html,
    });
  } catch (err) {
    console.error(err);
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

export { app }; // Exportamos `app` para usar en las pruebas
