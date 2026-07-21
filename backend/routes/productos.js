const express = require("express");
const Producto = require("../models/Producto");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const productos = await Producto.find().sort({ id: 1 });
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los productos" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const producto = await Producto.findOne({ id: Number(req.params.id) });
    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    res.json(producto);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el producto" });
  }
});

module.exports = router;
