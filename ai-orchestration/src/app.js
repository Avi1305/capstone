import express from "express";
import morgan from "morgan";
import agentRouter from "./routes/agent.routes.js";

const app = express();

// Middleware
app.use(morgan("dev"));
app.use(express.json());

app.get("/api/ai/healthz", (req, res) => {
  res
    .status(200)
    .json({ status: "ok", message: "AI Orchestration API is healthy" });
});
app.use("/api/ai/agent", agentRouter);

export default app;
