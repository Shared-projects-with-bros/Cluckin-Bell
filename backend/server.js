require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const productosRouter = require("./routes/productos");
const carritoRouter = require("./routes/carrito");
const pedidosRouter = require("./routes/pedidos");
const usuariosRouter = require("./routes/usuarios");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/cluckinbell";

app.use(cors());
app.use(express.json());

app.use("/api/productos", productosRouter);
app.use("/api/carrito", carritoRouter);
app.use("/api/pedidos", pedidosRouter);
app.use("/api/usuarios", usuariosRouter);

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Conectado a MongoDB");
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error al conectar a MongoDB:", error.message);
    process.exit(1);
  });
