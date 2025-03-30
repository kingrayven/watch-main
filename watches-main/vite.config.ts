import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import { tempo } from "tempo-devtools/dist/vite";
import type { PluginOption } from "vite";

export default defineConfig(({ mode }) => {
  // Load env from parent directory (adjust the path as needed)
  const envDir = path.resolve(__dirname, '..'); // Goes up one level
  const env = loadEnv(mode, envDir);

  const conditionalPlugins: [string, Record<string, any>][] = [];

  if (env.TEMPO === "true") {
    conditionalPlugins.push(["tempo-devtools/swc", {}]);
  }

  return {
    base: env.VITE_BASE_PATH || "/",
    envDir, // Specify the directory where .env files are located
    optimizeDeps: {
      entries: ["src/main.jsx", "src/tempobook/**/*"],
    },
    plugins: [
      react({
        plugins: conditionalPlugins,
      }),
      tempo(),
    ] as PluginOption[],
    resolve: {
      preserveSymlinks: true,
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      extensions: [".js", ".jsx", ".ts", ".tsx"],
    },
    server: {
      allowedHosts: ["all"], // Changed to array format
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL,
          changeOrigin: true,
          secure: false
        }
      }
    },
    build: {
      outDir: "dist",
      assetsDir: "assets",
      sourcemap: true,
    },
    define: {
      'process.env': env // Make env variables available
    }
  };
});