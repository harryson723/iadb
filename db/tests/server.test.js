import { jest } from "@jest/globals";
const mysql = await import("mysql2/promise"); // Import dinámico
import request from "supertest";
import { app } from "./index.js"; // Asegúrate de exportar `app` en index.js

// Mock de la conexión a MySQL
jest.unstable_mockModule("mysql2/promise", () => ({
  createConnection: jest.fn().mockResolvedValue({
    execute: jest.fn().mockResolvedValue([[]]),
    end: jest.fn().mockResolvedValue(),
  }),
}));

describe("Pruebas API", () => {
  test("Debe responder con estado 400 si no se envía tipo", async () => {
    const response = await request(app).post("/check").send({});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("NO_TYPE");
  });

  test("Debe responder con estado 400 si no se envían credenciales", async () => {
    const response = await request(app).post("/check").send({ type: "mysql" });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("NO_CREDENTIALS");
  });
});
