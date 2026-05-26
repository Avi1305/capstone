import express from "express";
import morgan from "morgan";
import { createPod } from "./kubernetes/pod.js";
import { createService } from "./kubernetes/service.js";
import { v7 as uuid } from "uuid";
import { createSandBoxKey } from "./config/redis.js";


const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/sandbox/health", (req, res) => {
  res.status(200).json({
    message: "Sandbox api is healthy",
    status: "ok",
  });
});

app.post("/api/sandbox/start", async (req, res) => {
  const sandBoxId = uuid();

  await Promise.all([
    createPod(sandBoxId),
    createService(sandBoxId),
    createSandBoxKey(sandBoxId)
  ]);

  return res.status(200).json({
    message: "Sandbox started",
    sandboxId: sandBoxId,
    previewUrl: `http://${sandBoxId}.preview.localhost`,
  });
});
export default app;
