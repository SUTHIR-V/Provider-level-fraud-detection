import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "https://medicarefraudservice-fahvamaaftc5e9f2.centralindia-01.azurewebsites.net/",
        changeOrigin: true,
      },
    },
  },
});
