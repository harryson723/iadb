const express = require("express");
const router = express.Router();
const { getVentasAnalisis } = require("../controllers/ventas.controller");

router.get("/", getVentasAnalisis);

module.exports = router;
