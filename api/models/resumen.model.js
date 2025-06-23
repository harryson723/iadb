const initDb = require("../config/db");

async function getResumen() {
  const db = await initDb();

  const [ingresosSemanaRows] = await db.execute(`
    SELECT SUM(total) AS ingresoSemana FROM ventas
    WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
    AND fecha < DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 7 DAY)
  `);

  const [ingresosMesRows] = await db.execute(`
    SELECT SUM(total) AS ingresoMes FROM ventas
    WHERE MONTH(fecha) = MONTH(CURRENT_DATE()) AND YEAR(fecha) = YEAR(CURRENT_DATE());
  `);

  const [gastosSemanaRows] = await db.execute(`
    SELECT SUM(dv.cantidad * p.costo_unidad) AS gastoSemana
    FROM ventas v
    JOIN detalle_venta dv ON v.id = dv.venta_id
    JOIN productos p ON dv.producto_id = p.id
    WHERE v.fecha >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
    AND v.fecha < DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 7 DAY)
  `);

  const [gastosMesRows] = await db.execute(`
    SELECT SUM(dv.cantidad * p.costo_unidad) AS gastoMes
    FROM ventas v
    JOIN detalle_venta dv ON v.id = dv.venta_id
    JOIN productos p ON dv.producto_id = p.id
    WHERE v.fecha >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
    AND v.fecha < DATE_ADD(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 MONTH)
  `);

  const [ingresosDiariosRows] = await db.execute(`
    SELECT
      DAYNAME(v.fecha) AS dia,
      DAYOFWEEK(v.fecha) AS orden,
      SUM(d.cantidad * (p.costo_unidad + p.ganancia_unidad)) AS ingreso
    FROM ventas v
    JOIN detalle_venta d ON v.id = d.venta_id
    JOIN productos p ON d.producto_id = p.id
    WHERE WEEK(v.fecha) = WEEK(CURDATE()) AND YEAR(v.fecha) = YEAR(CURDATE())
    GROUP BY DAYNAME(v.fecha), DAYOFWEEK(v.fecha)
    ORDER BY orden;
  `);

  const [gananciaMesQ] = await db.execute(`
    SELECT SUM(dv.cantidad * p.ganancia_unidad) AS gananciaTotal
    FROM ventas v
    JOIN detalle_venta dv ON v.id = dv.venta_id
    JOIN productos p ON dv.producto_id = p.id
    WHERE MONTH(v.fecha) = MONTH(CURDATE()) AND YEAR(v.fecha) = YEAR(CURDATE())
  `);

  return {
    ingresoSemana: ingresosSemanaRows[0]?.ingresoSemana || 0,
    ingresoMes: ingresosMesRows[0]?.ingresoMes || 0,
    gastoSemana: gastosSemanaRows[0]?.gastoSemana || 0,
    gastoMes: gastosMesRows[0]?.gastoMes || 0,
    gananciaMes: gananciaMesQ[0]?.gananciaTotal || 0,
    ingresosDiarios: ingresosDiariosRows.map((r) => ({
      dia: r.dia,
      ingreso: Number(r.ingreso || 0),
    })),
  };
}

module.exports = { getResumen };
