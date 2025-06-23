const { getResumen } = require("../models/resumen.model");

async function obtenerResumen(req, res) {
  try {
    const resumen = await getResumen();
    res.json(resumen);
  } catch (error) {
    console.error("Error en /resumen:", error);
    res.status(500).json({ message: "Error al obtener el resumen" });
  }
}

module.exports = { obtenerResumen };
