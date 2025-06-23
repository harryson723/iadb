const productoService = require("../services/producto.service");

async function crearProducto(req, res) {
  try {
    const id = await productoService.registrarProducto(req.body);
    res.status(201).json({ id, mensaje: "Producto creado exitosamente" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function obtenerProductos(req, res) {
  try {
    const productos = await productoService.listarProductos();
    res.json(productos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function obtenerProductoPorId(req, res) {
  try {
    const producto = await productoService.obtenerProducto(req.params.id);
    res.json(producto);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
}

async function actualizarProducto(req, res) {
  try {
    await productoService.actualizarProducto(req.params.id, req.body);
    res.json({ mensaje: "Producto actualizado exitosamente" });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
}

async function eliminarProducto(req, res) {
  try {
    await productoService.eliminarProducto(req.params.id);
    res.json({ mensaje: "Producto eliminado exitosamente" });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
}

module.exports = {
  crearProducto,
  obtenerProductos,
  obtenerProductoPorId,
  actualizarProducto,
  eliminarProducto,
};
