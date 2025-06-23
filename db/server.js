import app from "./app.js";

const port = 4000;

if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
  });
}