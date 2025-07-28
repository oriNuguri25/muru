import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import svgr from "vite-plugin-svgr";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), svgr()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "https://muru-eight.vercel.app",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        configure: (proxy) => {
          proxy.on("error", (err) => {
            console.log("프록시 오류: ", err);
          });
          proxy.on("proxyReq", (_proxyReq, req) => {
            console.log("프록시 요청: ", req.url);
          });
          proxy.on("proxyRes", (_proxyRes) => {
            console.log("프록시 응답: ", _proxyRes.statusCode);
          });
        },
      },
    },
  },
});
