import express from "express";
import cors from "cors";
import dbRoutes from "./routes/dbRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/", dbRoutes);

export default app;