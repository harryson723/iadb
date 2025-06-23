const productoModel = require("../models/producto.model");

async function registrarProducto(data) {
  if (!data.nit || !data.descripcion || !data.cantidadStock || !data.costoUnidad || !data.gananciaUnidad || !data.proveedor) {
    throw new Error("Todos los campos son requeridos.");
  }
  return await productoModel.crearProducto(data);
}

async function listarProductos() {
  return await productoModel.obtenerTodos();
}

async function obtenerProducto(id) {
  const producto = await productoModel.obtenerPorId(id);
  if (!producto) throw new Error("Producto no encontrado");
  return producto;
}

async function actualizarProducto(id, data) {
  const actualizado = await productoModel.actualizarProducto(id, data);
  if (!actualizado) throw new Error("Producto no encontrado");
  return true;
}

async function eliminarProducto(id) {
  const eliminado = await productoModel.eliminarProducto(id);
  if (!eliminado) throw new Error("Producto no encontrado");
  return true;
}

module.exports = {
  registrarProducto,
  listarProductos,
  obtenerProducto,
  actualizarProducto,
  eliminarProducto,
};
