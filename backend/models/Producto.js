const mongoose = require("mongoose");

const productoSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  nombre: { type: String, required: true },
  precio: { type: Number, required: true },
  descripcion: { type: String, required: true },
  ingredientes: { type: String, required: true },
  img: { type: String, required: true },
  favorito: { type: Boolean, default: false }
});

module.exports = mongoose.model("Producto", productoSchema);
