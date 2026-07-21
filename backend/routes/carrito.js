const express = require("express");
const Carrito = require("../models/Carrito");
const Producto = require("../models/Producto");

const router = express.Router();

async function poblarItems(items) {
  const productoIds = items.map((item) => item.productoId);
  const productos = await Producto.find({ id: { $in: productoIds } });

  return items
    .map((item) => {
      const producto = productos.find((p) => p.id === item.productoId);
      if (!producto) return null;
      return {
        productoId: item.productoId,
        cantidad: item.cantidad,
        nombre: producto.nombre,
        precio: producto.precio,
        img: producto.img,
        subtotal: producto.precio * item.cantidad
      };
    })
    .filter(Boolean);
}

async function obtenerOCrearCarrito(clienteId) {
  let carrito = await Carrito.findOne({ clienteId });
  if (!carrito) {
    carrito = await Carrito.create({ clienteId, items: [] });
  }
  return carrito;
}

router.get("/:clienteId", async (req, res) => {
  try {
    const carrito = await obtenerOCrearCarrito(req.params.clienteId);
    const items = await poblarItems(carrito.items);
    const total = items.reduce((sum, item) => sum + item.subtotal, 0);
    res.json({ clienteId: carrito.clienteId, items, total });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el carrito" });
  }
});

router.post("/:clienteId/agregar", async (req, res) => {
  try {
    const { productoId, cantidad } = req.body;
    const cantidadSegura = Math.max(1, Math.floor(Number(cantidad)) || 1);

    const producto = await Producto.findOne({ id: Number(productoId) });
    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    const carrito = await obtenerOCrearCarrito(req.params.clienteId);
    const item = carrito.items.find((entry) => entry.productoId === Number(productoId));

    if (item) {
      item.cantidad += cantidadSegura;
    } else {
      carrito.items.push({ productoId: Number(productoId), cantidad: cantidadSegura });
    }

    await carrito.save();
    const items = await poblarItems(carrito.items);
    const total = items.reduce((sum, entry) => sum + entry.subtotal, 0);
    res.json({ clienteId: carrito.clienteId, items, total });
  } catch (error) {
    res.status(500).json({ error: "Error al agregar el producto al carrito" });
  }
});

router.put("/:clienteId/item/:productoId", async (req, res) => {
  try {
    const productoId = Number(req.params.productoId);
    const cantidad = Math.max(0, Math.floor(Number(req.body.cantidad)) || 0);

    const carrito = await obtenerOCrearCarrito(req.params.clienteId);

    if (cantidad <= 0) {
      carrito.items = carrito.items.filter((entry) => entry.productoId !== productoId);
    } else {
      const item = carrito.items.find((entry) => entry.productoId === productoId);
      if (item) {
        item.cantidad = cantidad;
      } else {
        carrito.items.push({ productoId, cantidad });
      }
    }

    await carrito.save();
    const items = await poblarItems(carrito.items);
    const total = items.reduce((sum, entry) => sum + entry.subtotal, 0);
    res.json({ clienteId: carrito.clienteId, items, total });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar el carrito" });
  }
});

router.delete("/:clienteId/item/:productoId", async (req, res) => {
  try {
    const productoId = Number(req.params.productoId);
    const carrito = await obtenerOCrearCarrito(req.params.clienteId);
    carrito.items = carrito.items.filter((entry) => entry.productoId !== productoId);
    await carrito.save();

    const items = await poblarItems(carrito.items);
    const total = items.reduce((sum, entry) => sum + entry.subtotal, 0);
    res.json({ clienteId: carrito.clienteId, items, total });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el producto del carrito" });
  }
});

module.exports = router;
