import http from "k6/http";
import { check, group } from "k6";
import { Trend } from "k6/metrics";

// Métrica para tiempo de respuesta
let responseTimeTrend = new Trend("response_time_check");

export const options = {
  vus: 50, // Número de usuarios virtuales
  duration: "30s", // Duración de la prueba
};

export default function () {
  group("Check Connection Endpoint", function () {
    const payload = JSON.stringify({
      type: "mysql",
      credentials: { user: "usuario", password: "clave123", db: "mi_basededatos", host: "localhost" },
    });

    const params = {
      headers: { "Content-Type": "application/json" },
    };

    const res = http.post("http://localhost:4000/check", payload, params);
    // Verificación del status de respuesta
    check(res, {
      "response status is 200": (r) => r.status === 200,
      "response body contains 'success'": (r) => r.body.includes("Conexión exitosa"),
    });

    // Registro del tiempo de respuesta
    responseTimeTrend.add(res.timings.duration);
  });
}
