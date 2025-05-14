const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise'); // ✅ API basada en promesas
const cors = require('cors'); 
const app = express();
const PORT = 4001;

app.use(cors());
app.use(bodyParser.json());

// ✅ Conexión MySQL con promesas
let db;

async function initDb() {
  try {
    db = await mysql.createConnection({
      host: "db4free.net",
      user: 'harryfora',
      password: 'd4cebf08',
      database: 'creadendb'
    });
    console.log('✅ Conectado a la base de datos MySQL');
  } catch (err) {
    console.error('❌ Error al conectar a MySQL:', err);
  }
}
initDb();

// Calcular ganancia del 5%
function calcularGanancia(costoUnidad) {
  return parseFloat((costoUnidad * 0.05).toFixed(2));
}

// 📌 Crear producto
app.post('/productos', async (req, res) => {
  const { nit, descripcion, cantidadStock, costoUnidad, proveedor } = req.body;

  if (!nit || !descripcion || !cantidadStock || !costoUnidad || !proveedor) {
    return res.status(400).json({ error: 'Todos los campos son requeridos.' });
  }

  const gananciaUnidad = calcularGanancia(costoUnidad);

  const query = `
    INSERT INTO productos (nit, descripcion, cantidad_stock, costo_unidad, ganancia_unidad, proveedor)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  try {
    const [result] = await db.execute(query, [nit, descripcion, cantidadStock, costoUnidad, gananciaUnidad, proveedor]);
    res.status(201).json({ id: result.insertId, mensaje: 'Producto creado exitosamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📄 Obtener todos los productos
app.get('/productos', async (req, res) => {
  try {
    const [results] = await db.execute('SELECT * FROM productos');
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔍 Obtener producto por ID
app.get('/productos/:id', async (req, res) => {
  try {
    const [results] = await db.execute('SELECT * FROM productos WHERE id = ?', [req.params.id]);
    if (results.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(results[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✏️ Actualizar producto
app.put('/productos/:id', async (req, res) => {
  const { nit, descripcion, cantidadStock, costoUnidad, proveedor } = req.body;

  try {
    const [results] = await db.execute('SELECT * FROM productos WHERE id = ?', [req.params.id]);
    if (results.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });

    const producto = results[0];
    const nuevoCosto = costoUnidad || producto.costo_unidad;
    const nuevaGanancia = calcularGanancia(nuevoCosto);

    const updateQuery = `
      UPDATE productos SET
        nit = ?,
        descripcion = ?,
        cantidad_stock = ?,
        costo_unidad = ?,
        ganancia_unidad = ?,
        proveedor = ?
      WHERE id = ?
    `;

    await db.execute(updateQuery, [
      nit || producto.nit,
      descripcion || producto.descripcion,
      cantidadStock || producto.cantidad_stock,
      nuevoCosto,
      nuevaGanancia,
      proveedor || producto.proveedor,
      req.params.id
    ]);

    res.json({ mensaje: 'Producto actualizado exitosamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🗑️ Eliminar producto
app.delete('/productos/:id', async (req, res) => {
  try {
    const [result] = await db.execute('DELETE FROM productos WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ mensaje: 'Producto eliminado exitosamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/resumen', async (req, res) => {
  try {
    console.log('Iniciando consulta de resumen...');

    // Consulta para el ingreso de la semana
    const [ingresosSemanaRows] = await db.execute(`
      SELECT SUM(vendidas * (costo_unidad + ganancia_unidad)) AS ingresoSemana
      FROM productos
      WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
    `);
    
    // Consulta para el ingreso del mes
    const [ingresosMesRows] = await db.execute(`
      SELECT SUM(ganancia_unidad * vendidas) AS ingresoMes
FROM productos
WHERE fecha >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
  AND fecha < DATE_ADD(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 MONTH);
    `);
    
    // Consulta para el gasto de la semana
    const [gastosSemanaRows] = await db.execute(`
SELECT SUM(vendidas * costo_unidad) AS gastoSemana
FROM productos
WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
  AND fecha < DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 7 DAY);
    `);
    
    // Consulta para el gasto del mes
    const [gastosMesRows] = await db.execute(`
SELECT SUM(costo_unidad * vendidas) AS gastoMes FROM productos WHERE YEAR(fecha) = YEAR(CURRENT_DATE()) AND MONTH(fecha) = MONTH(CURRENT_DATE());
    `);    

    // Consulta para los ingresos diarios de la semana
    const [ingresosDiariosRows] = await db.execute(`
      SELECT 
        DAYNAME(fecha) AS dia,
        DAYOFWEEK(fecha) AS orden,
        SUM(vendidas * (costo_unidad + ganancia_unidad)) AS ingreso
      FROM productos
      WHERE WEEK(fecha) = WEEK(CURDATE()) AND YEAR(fecha) = YEAR(CURDATE())
      GROUP BY DAYNAME(fecha), DAYOFWEEK(fecha)
      ORDER BY orden
    `);

    const [gananciaMesQ] = await db.execute(`
SELECT SUM((costo_unidad + ganancia_unidad) * vendidas - costo_unidad * vendidas) AS gananciaTotal FROM productos;
    `);



    // Calcular la ganancia del mes
    const ingresoMes = ingresosMesRows[0]?.ingresoMes || 0;
    const gastoMes = gastosMesRows[0]?.gastoMes || 0;
 const gananciaMes =  gananciaMesQ[0]?.gananciaTotal 

    // Enviar la respuesta con el resumen
    res.json({
      ingresoSemana: ingresosSemanaRows[0]?.ingresoSemana || 0,
      ingresoMes,
      gastoSemana: gastosSemanaRows[0]?.gastoSemana || 0,
      gastoMes,
      gananciaMes,
      ingresosDiarios: ingresosDiariosRows.map(row => ({
        dia: row.dia,
        ingreso: Number(row.ingreso || 0)
      }))
    });

  } catch (error) {
    console.error('Error en /resumen:', error);
    res.status(500).json({ message: 'Error al obtener el resumen' });
  }
});


app.get('/ventas-analisis', async (req, res) => {
  try {
    const [ventasPorDia] = await db.execute(`
      SELECT 
        DAYNAME(MIN(fecha)) AS dia,
        SUM(vendidas) AS cantidad
      FROM productos
      GROUP BY DAYOFWEEK(fecha)
      ORDER BY DAYOFWEEK(fecha)
    `);

    const [productos] = await db.execute(`SELECT * FROM productos`);

    const topVendidos = productos
      .sort((a, b) => b.vendidas - a.vendidas)
      .slice(0, 5)
      .map(prod => ({ producto: prod.descripcion, cantidad: prod.vendidas }));

    res.json({
      ventasPorDia,
      productos,
      topVendidos
    });

  } catch (error) {
    console.error('Error en /ventas-analisis:', error);
    res.status(500).json({ message: 'Error al obtener datos de ventas y análisis' });
  }
});



app.listen(PORT, () => {
  console.log(`🚀 API corriendo en http://localhost:${PORT}`);
});
