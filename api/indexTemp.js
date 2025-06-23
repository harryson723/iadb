const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2/promise"); // ✅ API basada en promesas
const cors = require("cors");
const app = express();
const PORT = 4001;

app.use(cors());
app.use(bodyParser.json());

// ✅ Conexión MySQL con promesas
let db;

async function initDb() {
  try {
    db = await mysql.createConnection({
      host: "db4free.net",
      user: "harryfora",
      password: "d4cebf08",
      database: "creadendb",
    });
    console.log("✅ Conectado a la base de datos MySQL");
  } catch (err) {
    console.error("❌ Error al conectar a MySQL:", err);
  }
}
initDb();

// Calcular ganancia del 5%
function calcularGanancia(costoUnidad) {
  return parseFloat((costoUnidad * 0.05).toFixed(2));
}

// 📌 Crear producto
app.post("/productos", async (req, res) => {
  const {
    nit,
    descripcion,
    cantidadStock,
    costoUnidad,
    gananciaUnidad,
    proveedor,
  } = req.body;

  if (
    !nit ||
    !descripcion ||
    !cantidadStock ||
    !costoUnidad ||
    !gananciaUnidad ||
    !proveedor
  ) {
    return res.status(400).json({
      error: "Todos los campos son requeridos, incluyendo gananciaUnidad.",
    });
  }

  const query = `
    INSERT INTO productos (nit, descripcion, cantidad_stock, costo_unidad, ganancia_unidad, proveedor)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  try {
    const [result] = await db.execute(query, [
      nit,
      descripcion,
      cantidadStock,
      costoUnidad,
      gananciaUnidad,
      proveedor,
    ]);
    res
      .status(201)
      .json({ id: result.insertId, mensaje: "Producto creado exitosamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📄 Obtener todos los productos
app.get("/productos", async (req, res) => {
  try {
    const [results] = await db.execute("SELECT * FROM productos");
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔍 Obtener producto por ID
app.get("/productos/:id", async (req, res) => {
  try {
    const [results] = await db.execute("SELECT * FROM productos WHERE id = ?", [
      req.params.id,
    ]);
    if (results.length === 0)
      return res.status(404).json({ error: "Producto no encontrado" });
    res.json(results[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✏️ Actualizar producto
app.put("/productos/:id", async (req, res) => {
  const {
    nit,
    descripcion,
    cantidadStock,
    costoUnidad,
    gananciaUnidad,
    proveedor,
  } = req.body;

  try {
    const [results] = await db.execute("SELECT * FROM productos WHERE id = ?", [
      req.params.id,
    ]);
    if (results.length === 0)
      return res.status(404).json({ error: "Producto no encontrado" });

    const producto = results[0];

    const updateQuery = `
      UPDATE productos SET
        nit = ?,
        nombre = "temporal",
        descripcion = ?,
        cantidad_stock = ?,
        costo_unidad = ?,
        ganancia_unidad = ?,
        proveedor = ?
      WHERE id = ?
    `;

    await db.execute(updateQuery, [
      nit || producto.nit,
      descripcion || producto.descripcion,
      cantidadStock || producto.cantidad_stock,
      costoUnidad || producto.costo_unidad,
      gananciaUnidad || producto.ganancia_unidad,
      proveedor || producto.proveedor,
      req.params.id,
    ]);

    res.json({ mensaje: "Producto actualizado exitosamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🗑️ Eliminar producto
app.delete("/productos/:id", async (req, res) => {
  try {
    const [result] = await db.execute("DELETE FROM productos WHERE id = ?", [
      req.params.id,
    ]);
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Producto no encontrado" });
    res.json({ mensaje: "Producto eliminado exitosamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/resumen", async (req, res) => {
  try {
    console.log("Iniciando consulta de resumen...");

    // Consulta para el ingreso de la semana
    const [ingresosSemanaRows] = await db.execute(`
SELECT SUM(total) AS ingresoSemana FROM ventas WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) AND fecha < DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 7 DAY)
    `);

    // Consulta para el ingreso del mes
    const [ingresosMesRows] = await db.execute(`
      SELECT SUM(total) AS ingresoMes FROM ventas WHERE MONTH(fecha) = MONTH(CURRENT_DATE()) AND YEAR(fecha) = YEAR(CURRENT_DATE());
    `);

    // Consulta para el gasto de la semana
    const [gastosSemanaRows] = await db.execute(`
      SELECT SUM(dv.cantidad * p.costo_unidad) AS gastoSemana
FROM ventas v
JOIN detalle_venta dv ON v.id = dv.venta_id
JOIN productos p ON dv.producto_id = p.id
WHERE v.fecha >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
  AND v.fecha < DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 7 DAY)
    `);

    // Consulta para el gasto del mes
    const [gastosMesRows] = await db.execute(`
      SELECT SUM(dv.cantidad * p.costo_unidad) AS gastoMes
FROM ventas v
JOIN detalle_venta dv ON v.id = dv.venta_id
JOIN productos p ON dv.producto_id = p.id
WHERE v.fecha >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
  AND v.fecha < DATE_ADD(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 MONTH)
    `);

    // Consulta para los ingresos diarios de la semana
    const [ingresosDiariosRows] = await db.execute(`
      SELECT
    DAYNAME(v.fecha) AS dia,
    DAYOFWEEK(v.fecha) AS orden,
    SUM(d.cantidad * (p.costo_unidad + p.ganancia_unidad)) AS ingreso
FROM
    ventas v
JOIN
    detalle_venta d ON v.id = d.venta_id
JOIN
    productos p ON d.producto_id = p.id
WHERE
    WEEK(v.fecha) = WEEK(CURDATE()) AND YEAR(v.fecha) = YEAR(CURDATE())
GROUP BY
    DAYNAME(v.fecha), DAYOFWEEK(v.fecha)
ORDER BY
    orden;
    `);

    const [gananciaMesQ] = await db.execute(`
      select sum(dv.cantidad * p.ganancia_unidad) as gananciaTotal
from ventas v
inner join detalle_venta dv on v.id = dv.venta_id
inner join productos p on dv.producto_id = p.id
where year(v.fecha) = year(curdate()) and month(v.fecha) = month(curdate());
    `);

    // Calcular la ganancia del mes
    const ingresoMes = ingresosMesRows[0]?.ingresoMes || 0;
    const gastoMes = gastosMesRows[0]?.gastoMes || 0;
    const gananciaMes = gananciaMesQ[0]?.gananciaTotal;

    // Enviar la respuesta con el resumen
    res.json({
      ingresoSemana: ingresosSemanaRows[0]?.ingresoSemana || 0,
      ingresoMes,
      gastoSemana: gastosSemanaRows[0]?.gastoSemana || 0,
      gastoMes,
      gananciaMes,
      ingresosDiarios: ingresosDiariosRows.map((row) => ({
        dia: row.dia,
        ingreso: Number(row.ingreso || 0),
      })),
    });
  } catch (error) {
    console.error("Error en /resumen:", error);
    res.status(500).json({ message: "Error al obtener el resumen" });
  }
});

app.get("/ventas-analisis", async (req, res) => {
  try {
    // Obtener ventas por día (lunes a domingo) de la semana actual
    const [ventasPorDia] = await db.execute(`
      SELECT 
        DAYNAME(v.fecha) AS dia,
        SUM(dv.cantidad) AS cantidad
      FROM ventas v
      JOIN detalle_venta dv ON v.id = dv.venta_id
      WHERE v.fecha BETWEEN
        DATE_SUB(CURDATE(), INTERVAL (DAYOFWEEK(CURDATE()) - 2) DAY)  -- Lunes de esta semana
        AND DATE_ADD(CURDATE(), INTERVAL (7 - DAYOFWEEK(CURDATE())) DAY)  -- Domingo de esta semana
      GROUP BY DAYOFWEEK(v.fecha), DAYNAME(v.fecha)  -- Aseguramos que se agrupe por el nombre del día
      ORDER BY DAYOFWEEK(v.fecha)
    `);

    // Obtener todos los productos
    const [productos] = await db.execute(`
      SELECT 
    p.id,
    p.descripcion,
    p.cantidad_stock,
    p.costo_unidad,
    p.ganancia_unidad,
    p.proveedor,
    p.nit,
    p.fecha,
    COALESCE(SUM(dv.cantidad), 0) AS vendidas
  FROM productos p
  LEFT JOIN detalle_venta dv ON p.id = dv.producto_id
  LEFT JOIN ventas v ON v.id = dv.venta_id
    AND v.fecha BETWEEN
      DATE_SUB(CURDATE(), INTERVAL (DAYOFWEEK(CURDATE()) - 2) DAY)  -- Lunes de esta semana
      AND DATE_ADD(CURDATE(), INTERVAL (7 - DAYOFWEEK(CURDATE())) DAY)  -- Domingo de esta semana
  GROUP BY p.id
    `);

    // Obtener los 5 productos más vendidos
    const [productosVendidos] = await db.execute(`
      SELECT 
        p.id, 
        p.descripcion,
        SUM(dv.cantidad) AS vendidas
      FROM productos p
      JOIN detalle_venta dv ON p.id = dv.producto_id
      JOIN ventas v ON v.id = dv.venta_id
      WHERE v.fecha BETWEEN
        DATE_SUB(CURDATE(), INTERVAL (DAYOFWEEK(CURDATE()) - 2) DAY)  -- Lunes de esta semana
        AND DATE_ADD(CURDATE(), INTERVAL (7 - DAYOFWEEK(CURDATE())) DAY)  -- Domingo de esta semana
      GROUP BY p.id
      ORDER BY vendidas DESC
    `);

    // Obtener los 5 productos más vendidos
    const topVendidos = productosVendidos.slice(0, 5).map((prod) => ({
      producto: prod.descripcion,
      cantidad: prod.vendidas,
    }));

    // Responder con los datos
    res.json({
      ventasPorDia,
      productos,
      topVendidos,
    });
  } catch (error) {
    console.error("Error en /ventas-analisis:", error);
    res
      .status(500)
      .json({ message: "Error al obtener datos de ventas y análisis" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 API corriendo en http://localhost:${PORT}`);
});
