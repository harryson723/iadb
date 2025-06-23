import mysql from "mysql2/promise";
import client from "../config/openai.js";
import { verifyDB } from "../utils/dbUtils.js";

// Cache simple en memoria para esquemas de base de datos
const schemaCache = {};

export const testConnection = async (credentials) => {
  const connection = await mysql.createConnection({
    host: credentials.host,
    user: credentials.user,
    password: credentials.password,
    database: credentials.db,
  });
  await connection.end();
  return true;
};

// Genera una tabla HTML simple a partir de datos reales
function buildHtmlTable(data) {
  if (!data.length) return "<p>No hay datos disponibles.</p>";
  const headers = Object.keys(data[0]);
  const thead = `<thead><tr>${headers
    .map((h) => `<th>${h}</th>`)
    .join("")}</tr></thead>`;
  const tbody = `<tbody>${data
    .map(
      (row) => `<tr>${headers.map((h) => `<td>${row[h]}</td>`).join("")}</tr>`
    )
    .join("")}</tbody>`;
  return `<table>${thead}${tbody}</table>`;
}

// Función principal
export const processQuery = async (credentials, query) => {
  const init = new Date();
  const connection = await mysql.createConnection({
    host: credentials.host,
    user: credentials.user,
    password: credentials.password,
    database: credentials.db,
  });
  
  const cacheKey = `${credentials.user}@${credentials.host}/${credentials.db}`;
  let schema;
  if (schemaCache[cacheKey]) {
    schema = schemaCache[cacheKey];
    console.log("🔁 Esquema desde cache");
  } else {
    schema = await verifyDB(connection);
    schemaCache[cacheKey] = schema;
    console.log("✅ Esquema cargado desde DB y cacheado");
  }

  // Solicita al modelo una sola respuesta con SQL e instrucción de formato
  const response = await client.chat.completions.create({
    model: "o3-mini-2025-01-31",
    messages: [
      {
        role: "system",
        content: `Eres un asistente SQL para aplicaciones de ventas. 
Dado un esquema de base de datos y una consulta en lenguaje natural, responde en formato JSON:

Si puedes resolver la consulta con SQL, responde:
{
  "type": "query",
  "sql": "<consulta SQL>",
  "format": "<cómo presentar los resultados>"
}

Si no se puede resolver con SQL, responde:
{
  "type": "friendly",
  "explanation": "<respuesta amigable en HTML>"
}

No incluyas texto adicional ni comentarios. Solo responde con JSON.`,
      },
      {
        role: "user",
        content: `Esquema: ${JSON.stringify(schema)}\nConsulta: "${query}"`,
      },
    ],
  });

  // Intenta interpretar la respuesta JSON
  const rawContent = response.choices[0].message.content.trim();
  let parsed;
  try {
    parsed = JSON.parse(rawContent);
  } catch (err) {
    await connection.end();
    throw new Error("Error al interpretar la respuesta del modelo.");
  }

  // Si es una consulta amigable
  if (parsed.type === "friendly") {
    await connection.end();
    return {
      type: "otra",
      content: parsed.explanation,
    };
  }

  // Si es una consulta SQL válida
  if (parsed.type === "query" && parsed.sql) {
    let results;
    try {
      [results] = await connection.execute(parsed.sql);
    } catch (err) {
      await connection.end();
      throw new Error("Error al ejecutar la consulta SQL generada.");
    }
    await connection.end();

    const htmlTable = buildHtmlTable(results);

    // Puedes agregar el formato sugerido si quieres
    const header = parsed.format ? `<p>${parsed.format}</p>` : "";
    console.log(new Date() - init);
    return {
      type: "query",
      content: header + htmlTable,
    };
  }

  await connection.end();
  throw new Error("La respuesta del modelo no es válida o está incompleta.");
};
