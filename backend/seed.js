require("dotenv").config();
const mongoose = require("mongoose");
const Producto = require("./models/Producto");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/cluckinbell";

const menu = [
  {
    id: 1,
    nombre: "Oreja de Pollo",
    precio: 3.5,
    descripcion: "Crujiente y jugosa oreja de pollo empanizada, acompañada de papas fritas y salsa especial.",
    ingredientes: "Oreja de pollo, pan rallado, especias, papas fritas, salsa especial.",
    img: "img/orejadepollo.png",
    favorito: true
  },
  {
    id: 2,
    nombre: "Ala de Cerdo",
    precio: 6.99,
    descripcion: "Tres piezas de cerdo empanizadas, acompañadas de salsa especial y bebida pequeña",
    ingredientes: "Ala de cerdo, pan rallado, especias, salsa especial, bebida pequeña.",
    img: "img/aladecerdo.png",
    favorito: true
  },
  {
    id: 3,
    nombre: "DinoRico",
    precio: 99.99,
    descripcion: "Para los que gustan de algo prehistorico.",
    ingredientes: "Compy entero, una cuchara de sal volcanica, Jugo de limon de la era de hielo, huevo de giganoto, aceite de pablo, LA CEBOLLA",
    img: "img/Dinorico.png",
    favorito: true
  },
  {
    id: 4,
    nombre: "Pata de Pescado",
    precio: 12.9,
    descripcion: "Pata de pescado empanizada acompañada de ensalada, salsa de ajo y papas fritas, salsa de rábano",
    ingredientes: "Pata de pescado, especias, ensalada, salsa de ajo, papas fritas.",
    img: "img/patadepescado.png",
    favorito: true
  },
  {
    id: 5,
    nombre: "Hot Wings San Andreas",
    precio: 5.75,
    descripcion: "Alitas picantes banadas en salsa roja con un toque dulce y ahumado.",
    ingredientes: "Seis alitas, salsa picante, aderezo ranch, apio, papas pequenas y bebida.",
    img: "img/Cluckin bell.png",
    favorito: false
  },
  {
    id: 6,
    nombre: "Cluckin Strips",
    precio: 4.8,
    descripcion: "Tiras de pollo crujiente perfectas para banar en salsa especial.",
    ingredientes: "Cinco tiras de pollo, papas medianas, salsa miel mostaza y bebida regular.",
    img: "img/Cluckin bell.png",
    favorito: false
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Conectado a MongoDB");

    for (const producto of menu) {
      await Producto.findOneAndUpdate({ id: producto.id }, producto, {
        upsert: true,
        new: true
      });
    }

    console.log(`${menu.length} productos sembrados correctamente.`);
  } catch (error) {
    console.error("Error al sembrar productos:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
