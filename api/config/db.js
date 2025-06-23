const mysql = require("mysql2/promise");

let db;

async function initDb() {
  if (!db) {
    db = await mysql.createConnection({
      host: "db4free.net",
      user: "harryfora",
      password: "d4cebf08",
      database: "creadendb",
    });
    console.log("✅ Conectado a la base de datos MySQL");
  }
  return db;
}

module.exports = initDb;
