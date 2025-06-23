import { AVAILABLE_DBS } from "../config/dbs.js";
import { testConnection, processQuery } from "../services/dbService.js";

export const checkConnection = async (req, res) => {
  const { type, credentials } = req.body;

  if (!type || !credentials)
    return res
      .status(400)
      .json({ error: "BAD_REQUEST", message: "Faltan campos" });

  if (!AVAILABLE_DBS.includes(type))
    return res.status(400).json({ error: "NO_TYPE_AVAILABLE" });

  try {
    await testConnection(credentials);
    return res.json({ success: true, message: "Conexión exitosa." });
  } catch (err) {
    return res.status(400).json({
      error: "ERROR_CONNECTION",
      message: "Error al conectar",
      details: err.message,
    });
  }
};

export const runQuery = async (req, res) => {
  const { credentials, query } = req.body;

  if (!credentials || !query)
    return res
      .status(400)
      .json({ error: "BAD_REQUEST", message: "Faltan campos" });

  try {
    const result = await processQuery(credentials.credentials, query);
    return res.json({
      success: true,
      message:
        result.type === "query"
          ? "Consulta ejecutada"
          : "Consulta no clasificada",
      data: result.content,
    });
  } catch (err) {
    return res.status(500).json({
      error: "ERROR_QUERY",
      message: "Error al ejecutar la consulta",
      details: err.message,
    });
  }
};
