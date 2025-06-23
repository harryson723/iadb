const initDb = require("../config/db");

async function crearProducto(data) {
  const db = await initDb();
  const query = `
    INSERT INTO productos (nit, descripcion, cantidad_stock, costo_unidad, ganancia_unidad, proveedor)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const [result] = await db.execute(query, [
    data.nit,
    data.descripcion,
    data.cantidadStock,
    data.costoUnidad,
    data.gananciaUnidad,
    data.proveedor,
  ]);
  return result.insertId;
}

async function obtenerTodos() {
  const db = await initDb();
  const [results] = await db.execute("SELECT * FROM productos");
  return results;
}

async function obtenerPorId(id) {
  const db = await initDb();
  const [results] = await db.execute("SELECT * FROM productos WHERE id = ?", [id]);
  return results[0];
}

async function actualizarProducto(id, data) {
  const db = await initDb();
  const productoActual = await obtenerPorId(id);
  if (!productoActual) return null;

  const query = `
    UPDATE productos SET
      nit = ?,
      descripcion = ?,
      cantidad_stock = ?,
      costo_unidad = ?,
      ganancia_unidad = ?,
      proveedor = ?
    WHERE id = ?
  `;

  await db.execute(query, [
    data.nit || productoActual.nit,
    data.descripcion || productoActual.descripcion,
    data.cantidadStock || productoActual.cantidad_stock,
    data.costoUnidad || productoActual.costo_unidad,
    data.gananciaUnidad || productoActual.ganancia_unidad,
    data.proveedor || productoActual.proveedor,
    id,
  ]);

  return true;
}

async function eliminarProducto(id) {
  const db = await initDb();
  const [result] = await db.execute("DELETE FROM productos WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

module.exports = {
  crearProducto,
  obtenerTodos,
  obtenerPorId,
  actualizarProducto,
  eliminarProducto,
};
