const express = require("express");
const bcrypt = require("bcryptjs");
const Usuario = require("../models/Usuario");

const router = express.Router();

router.post("/registro", async (req, res) => {
  try {
    const nombre = (req.body.nombre || "").toString().trim();
    const correo = (req.body.correo || "").toString().trim().toLowerCase();
    const password = (req.body.password || "").toString();

    if (!nombre || !correo || !password) {
      return res.status(400).json({ error: "Nombre, correo y contrasena son requeridos" });
    }

    const existente = await Usuario.findOne({ correo });
    if (existente) {
      return res.status(409).json({ error: "Ya existe una cuenta con ese correo" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const usuario = await Usuario.create({ nombre, correo, password: passwordHash });

    res.status(201).json({ nombre: usuario.nombre, correo: usuario.correo });
  } catch (error) {
    res.status(500).json({ error: "Error al crear la cuenta" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const correo = (req.body.correo || "").toString().trim().toLowerCase();
    const password = (req.body.password || "").toString();

    const usuario = await Usuario.findOne({ correo });
    if (!usuario) {
      return res.status(401).json({ error: "Correo o contrasena incorrectos" });
    }

    const coincide = await bcrypt.compare(password, usuario.password);
    if (!coincide) {
      return res.status(401).json({ error: "Correo o contrasena incorrectos" });
    }

    res.json({ nombre: usuario.nombre, correo: usuario.correo });
  } catch (error) {
    res.status(500).json({ error: "Error al iniciar sesion" });
  }
});

module.exports = router;
