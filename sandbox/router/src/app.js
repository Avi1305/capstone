import express from "express";
import morgan from "morgan";
import { createProxyMiddleware } from "http-proxy-middleware";
import http from "http";
import { createProxyServer } from "httpxy";
import { refreshTTL } from "./config/redis.js";

const app = express();

const server = http.createServer(app);

app.use(morgan("combined"));

app.get("/api/status/healthz", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/api/status/readyz", (req, res) => {
  res.status(200).json({ status: "ready" });
});

const proxies = {};
const agentProxies = {};

function getProxy(sandBoxId) {
  if (!proxies[sandBoxId]) {
    proxies[sandBoxId] = createProxyMiddleware({
      target: `http://sandbox-service-${sandBoxId}`,
      changeOrigin: true,
      logLevel: "debug",
    });
  }

  return proxies[sandBoxId];
}

function getAgentProxy(sandBoxId) {
  if (!agentProxies[sandBoxId]) {
    agentProxies[sandBoxId] = createProxyMiddleware({
      target: `http://sandbox-service-${sandBoxId}:3000`,
      changeOrigin: true,
      logLevel: "debug",
    });
  }

  return agentProxies[sandBoxId];
}

app.use(async(req, res, next) => {
  const host = req.headers.host;
  const sandBoxId = host.split(".")[0];
  await refreshTTL(sandBoxId);

  if (host.split(".")[1] === "agent") {
    return getAgentProxy(sandBoxId)(req, res, next);
  }

  return getProxy(sandBoxId)(req, res, next);
});

const wsProxy = createProxyServer({
  changeOrigin: true,
});

wsProxy.on("error", (err, req, socket) => {
  console.error("WS proxy error:", err.message);

  socket?.destroy();
});

server.on("upgrade", (req, socket, head) => {
  const host = req.headers.host;

  if (!host) {
    socket.destroy();
    return;
  }

  socket.on("error", () => socket.destroy());

  const sandBoxId = host.split(".")[0];
  const type = host.split(".")[1];

  console.log(
    `WS upgrade request: ${host}, sandboxId: ${sandBoxId}, type: ${type}`,
  );

  if (type === "agent") {
    wsProxy.ws(
      req,
      socket,
      {
        target: `http://sandbox-service-${sandBoxId}:3000`,
      },
      head,
    );

    return;
  }

  if (type === "preview") {
    wsProxy.ws(
      req,
      socket,
      {
        target: `http://sandbox-service-${sandBoxId}`,
      },
      head,
    );

    return;
  }

  socket.destroy();
});

export default server;
