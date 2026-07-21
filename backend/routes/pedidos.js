const express = require("express");
const Pedido = require("../models/Pedido");
const Carrito = require("../models/Carrito");
const Producto = require("../models/Producto");

const router = express.Router();

async function generarCodigoUnico() {
  let codigo;
  let existe = true;

  while (existe) {
    codigo = String(Math.floor(100000 + Math.random() * 900000));
    existe = await Pedido.exists({ codigo });
  }

  return codigo;
}

router.get("/", async (req, res) => {
  try {
    const pedidos = await Pedido.find().sort({ createdAt: -1 });
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los pedidos" });
  }
});

router.get("/:clienteId", async (req, res) => {
  try {
    const pedidos = await Pedido.find({ clienteId: req.params.clienteId }).sort({ createdAt: -1 });
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los pedidos" });
  }
});

router.patch("/:codigo/estado", async (req, res) => {
  try {
    const { estado } = req.body;
    const pedido = await Pedido.findOneAndUpdate(
      { codigo: req.params.codigo },
      { estado },
      { new: true }
    );

    if (!pedido) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    res.json(pedido);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar el estado del pedido" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { clienteId, cliente } = req.body;

    if (!clienteId || !cliente || !cliente.nombre || !cliente.telefono || !cliente.direccion) {
      return res.status(400).json({ error: "Datos de cliente incompletos" });
    }

    const carrito = await Carrito.findOne({ clienteId });
    if (!carrito || carrito.items.length === 0) {
      return res.status(400).json({ error: "El carrito esta vacio" });
    }

    const productoIds = carrito.items.map((item) => item.productoId);
    const productos = await Producto.find({ id: { $in: productoIds } });

    const items = carrito.items
      .map((item) => {
        const producto = productos.find((p) => p.id === item.productoId);
        if (!producto) return null;
        return {
          productoId: producto.id,
          nombre: producto.nombre,
          precio: producto.precio,
          cantidad: item.cantidad
        };
      })
      .filter(Boolean);

    if (items.length === 0) {
      return res.status(400).json({ error: "El carrito no tiene productos validos" });
    }

    const total = items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
    const codigo = await generarCodigoUnico();

    const pedido = await Pedido.create({
      codigo,
      clienteId,
      cliente,
      items,
      total,
      estado: "Pendiente"
    });

    carrito.items = [];
    await carrito.save();

    res.status(201).json(pedido);
  } catch (error) {
    res.status(500).json({ error: "Error al crear el pedido" });
  }
});

module.exports = router;
