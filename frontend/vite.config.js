import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    allowedHosts: "all",
    hmr: false,
    proxy: {
      // REST API — forwarded to the backend/ingress
      "/api": {
        target: "http://127.0.0.1:80",
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: {
          "*": "",
        },
        configure: (proxy) => {
          proxy.on("error", (err) => console.log("proxy error", err));
          proxy.on("proxyReq", (_, req) =>
            console.log("proxying:", req.method, req.url),
          );
          proxy.on("proxyRes", (res, req) =>
            console.log("got response:", res.statusCode, req.url),
          );
        },
      },
      "/agent": {
        target: "http://127.0.0.1:80",

        changeOrigin: false,

        secure: false,

        ws: true,

        rewrite: (path) => path.replace(/^\/agent/, ""),

        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            const sandboxId = req.headers["x-sandbox-id"];

            proxyReq.setHeader("Host", `${sandboxId}.agent.localhost`);
          });

          proxy.on("error", (err) => {
            console.log("agent proxy error:", err);
          });
        },
      },
    },
  },
});
