    import { defineConfig } from "vite";
    import react from "@vitejs/plugin-react-swc";
    import path from "path";
    import { componentTagger } from "lovable-tagger";
    
    // https://vitejs.dev/config/
    export default defineConfig(({ mode }) => {
      // Define your backend URLs
      const localBackendUrl = "http://localhost:5000";
      // IMPORTANT: This environment variable VITE_API_BASE_URL MUST be set in your Netlify build environment
      // to point to your *actual deployed backend URL*.
      const productionBackendUrl = process.env.VITE_API_BASE_URL || "https://your-default-backend-if-not-set.com"; // Fallback if not set
    
      const csp = [
        "default-src 'self'",
        "script-src 'self' https://cdn.gpteng.co 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https://lovable.dev res.cloudinary.com", // Allow Cloudinary images/PDFs
        "font-src 'self'",
        // Ensure productionBackendUrl is correctly resolved and included
        `connect-src 'self' ${localBackendUrl} ws://localhost:8080 wss://localhost:8080 ws://localhost:5000 wss://localhost:5000 https://*.ngrok-free.app wss://*.ngrok-free.app ${productionBackendUrl} https://api.cloudinary.com`,
        "object-src 'self' blob: data:",
        // Ensure productionBackendUrl and res.cloudinary.com are in frame-src
        `frame-src 'self' blob: data: res.cloudinary.com ${localBackendUrl} ${productionBackendUrl}`,
        "worker-src 'self' blob:",
        "frame-ancestors 'self'",
        "media-src 'self' blob: data: res.cloudinary.com",
      ].join('; ');
    
      return {
        server: {
          host: "::",
          port: 8080,
          headers: {
            'Content-Security-Policy': csp
          }
        },
        plugins: [
          react(),
          mode === 'development' && componentTagger(),
        ].filter(Boolean),
        resolve: {
          alias: {
            "@": path.resolve(__dirname, "./src"),
          },
        },
      };
    });
    