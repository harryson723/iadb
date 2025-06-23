const { obtenerAnalisisVentas } = require("../models/ventas.model");

async function getVentasAnalisis(req, res) {
  try {
    const data = await obtenerAnalisisVentas();
    res.json(data);
  } catch (error) {
    console.error("Error en /ventas-analisis:", error);
    res.status(500).json({ message: "Error al obtener datos de ventas" });
  }
}

module.exports = { getVentasAnalisis };
