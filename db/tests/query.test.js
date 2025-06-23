import http from "k6/http";
import { check, group } from "k6";
import { Trend } from "k6/metrics";

let responseTimeTrend = new Trend("response_time_query");

export const options = {
  vus: 10, // Número de usuarios virtuales
  duration: "20s", // Duración de la prueba
};

export default function () {
  group("Run Query Endpoint", function () {
    const payload = JSON.stringify({
      credentials: {
        credentials: { user: "usuario", password: "clave123", db: "mi_basededatos", host: "localhost" },
      },
      query: "dime las ganancias que tengo", // Ajusta la consulta según tus pruebas
    });

    const params = {
      headers: { "Content-Type": "application/json" },
    };

    const res = http.post("http://localhost:4000/query", payload, params);
    console.log(res)
    // Verificación del status de respuesta
    check(res, {
      "response status is 200": (r) => r.status === 200,
      "response body contains 'Consulta ejecutada'": (r) =>
        r.body.includes("Consulta ejecutada"),
    });

    // Registro del tiempo de respuesta
    responseTimeTrend.add(res.timings.duration);
  });
}
