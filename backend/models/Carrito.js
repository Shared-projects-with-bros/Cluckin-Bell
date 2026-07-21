const mongoose = require("mongoose");

const carritoItemSchema = new mongoose.Schema(
  {
    productoId: { type: Number, required: true },
    cantidad: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const carritoSchema = new mongoose.Schema({
  clienteId: { type: String, required: true, unique: true },
  items: { type: [carritoItemSchema], default: [] }
});

module.exports = mongoose.model("Carrito", carritoSchema);
