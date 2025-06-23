const initDb = require("../config/db");

async function obtenerAnalisisVentas() {
  const db = await initDb();

  const [ventasPorDia] = await db.execute(`
    SELECT 
      DAYNAME(v.fecha) AS dia,
      SUM(dv.cantidad) AS cantidad
    FROM ventas v
    JOIN detalle_venta dv ON v.id = dv.venta_id
    WHERE v.fecha BETWEEN
      DATE_SUB(CURDATE(), INTERVAL (DAYOFWEEK(CURDATE()) - 2) DAY)
      AND DATE_ADD(CURDATE(), INTERVAL (7 - DAYOFWEEK(CURDATE())) DAY)
    GROUP BY DAYOFWEEK(v.fecha), DAYNAME(v.fecha)
    ORDER BY DAYOFWEEK(v.fecha)
  `);

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
        DATE_SUB(CURDATE(), INTERVAL (DAYOFWEEK(CURDATE()) - 2) DAY)
        AND DATE_ADD(CURDATE(), INTERVAL (7 - DAYOFWEEK(CURDATE())) DAY)
    GROUP BY p.id
  `);

  const [productosVendidos] = await db.execute(`
    SELECT 
      p.id, 
      p.descripcion,
      SUM(dv.cantidad) AS vendidas
    FROM productos p
    JOIN detalle_venta dv ON p.id = dv.producto_id
    JOIN ventas v ON v.id = dv.venta_id
    WHERE v.fecha BETWEEN
      DATE_SUB(CURDATE(), INTERVAL (DAYOFWEEK(CURDATE()) - 2) DAY)
      AND DATE_ADD(CURDATE(), INTERVAL (7 - DAYOFWEEK(CURDATE())) DAY)
    GROUP BY p.id
    ORDER BY vendidas DESC
  `);

  return {
    ventasPorDia,
    productos,
    topVendidos: productosVendidos.slice(0, 5).map((prod) => ({
      producto: prod.descripcion,
      cantidad: prod.vendidas,
    })),
  };
}

module.exports = { obtenerAnalisisVentas };
