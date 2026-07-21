const mongoose = require("mongoose");

const pedidoItemSchema = new mongoose.Schema(
  {
    productoId: { type: Number, required: true },
    nombre: { type: String, required: true },
    precio: { type: Number, required: true },
    cantidad: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const pedidoSchema = new mongoose.Schema(
  {
    codigo: { type: String, required: true, unique: true },
    clienteId: { type: String, required: true },
    cliente: {
      nombre: { type: String, required: true },
      telefono: { type: String, required: true },
      direccion: { type: String, required: true }
    },
    items: { type: [pedidoItemSchema], default: [] },
    total: { type: Number, required: true },
    estado: { type: String, default: "Pendiente" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Pedido", pedidoSchema);
