const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const initDb = require("./config/db");

const productoRoutes = require("./routes/producto.routes");
const resumenRoutes = require("./routes/resumen.routes");
const ventasRoutes = require("./routes/ventas.routes");

const app = express();
const PORT = 4001;

app.use(cors());
app.use(bodyParser.json());

initDb(); // Conexión MySQL

// Rutas
app.use("/productos", productoRoutes);
app.use("/resumen", resumenRoutes);
app.use("/ventas-analisis", ventasRoutes);

app.listen(PORT, () => {
  console.log(`🚀 API corriendo en http://localhost:${PORT}`);
});