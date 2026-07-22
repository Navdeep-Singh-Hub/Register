import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { razorpayApiPlugin } from "./server/razorpayApi.ts";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), razorpayApiPlugin(env)],
  };
});
