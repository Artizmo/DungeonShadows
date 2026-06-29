import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths"; // 👈 1. Import the path resolver plugin

const terminalCustomizerPlugin = () => ({
  name: "terminal-customizer",
  configureServer() {
    process.stdout.write("\x1Bc");
    process.stdout.write("\x1b]0;⚔️ DS Web Server\x07");
  },
});

export default defineConfig({
  plugins: [
    tsconfigPaths(), // 👈 2. Add it here so Vite automatically reads your tsconfig.json paths
    tailwindcss(),
    tanstackRouter({
      target: "react",
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
    }),
    terminalCustomizerPlugin(),
    react(),
  ],
  server: {
    host: true,
    port: Number(process.env.VITE_WEB_PORT),
  },
  build: {
    target: "esnext",
  },
});
