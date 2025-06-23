import { Router } from "express";
import { checkConnection, runQuery } from "../controllers/dbController.js";

const router = Router();

router.post("/check", checkConnection);
router.post("/query", runQuery);

export default router;
