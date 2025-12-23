
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { FileX, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * NotFound Component
 * 
 * Displays a 404 error page with animation when users navigate to non-existent routes
 * Logs the attempted path to the console for debugging
 * Provides a link back to the home page
 * 
 * @returns {JSX.Element} The 404 page component
 */
const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.div 
        className="text-center px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="mb-6 flex justify-center"
        >
          <FileX className="h-20 w-20 text-shariah-green dark:text-green-400" />
        </motion.div>
        <h1 className="text-6xl font-bold mb-4 text-shariah-green dark:text-green-400">404</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
          Oops! The page you're looking for doesn't exist
        </p>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            asChild
            className="bg-shariah-green hover:bg-shariah-green/90 dark:bg-green-600 dark:hover:bg-green-700 gap-2"
          >
            <Link to="/">
              <Home size={16} />
              Return to Home
            </Link>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFound;
