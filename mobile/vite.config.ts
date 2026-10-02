import path from "path"
import react from "@vitejs/plugin-react"
import legacy from "@vitejs/plugin-legacy"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), legacy({
    // Android 8 can still ship a WebView without ES modules. Bundle the fallback
    // and its polyfills locally so the APK also starts with no network access.
    targets: ['Chrome >= 58'],
    modernPolyfills: ['es.array.at', 'es.object.from-entries', 'es.string.replace-all', 'es.promise.finally'],
    additionalLegacyPolyfills: ['abortcontroller-polyfill/dist/abortcontroller-polyfill-only'],
    additionalModernPolyfills: ['abortcontroller-polyfill/dist/abortcontroller-polyfill-only'],
  })],
  server: {
    port: 3200,
  },
  preview: {
    allowedHosts: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
