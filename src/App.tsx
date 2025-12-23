
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SessionProvider } from "./contexts/SessionContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { motion, AnimatePresence } from "framer-motion";
import "./App.css";

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

/**
 * App Component
 * 
 * Root application component that sets up:
 * - React Query for data fetching
 * - Theme provider for light/dark mode
 * - Toasts for notifications
 * - Routing for page navigation
 * - Animation transitions between pages
 */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <SessionProvider>
        <TooltipProvider>
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Toast notifications */}
              <Toaster />
              <Sonner />
              
              {/* Application routing */}
              <BrowserRouter>
                <div className="min-h-screen bg-background">
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
              </BrowserRouter>
            </motion.div>
          </AnimatePresence>
        </TooltipProvider>
      </SessionProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
