
import React, { useEffect } from 'react';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ContractProvider } from '@/contexts/ContractContext';
import MainContent from '@/components/MainContent';
import { motion } from 'framer-motion';

/**
 * Index Page Component
 * 
 * Main entry point for the application
 * Sets up required context providers and renders the main content
 * Applies smooth page transitions and initial animations
 * 
 * @returns {JSX.Element} The index page component
 */
const Index: React.FC = () => {
  // Set page title and meta tags on component mount
  useEffect(() => {
    document.title = 'Shariaa Analyzer - Document Analysis';
    
    // Optional: Add meta tags for better SEO
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Analyze contract documents for Shariaa compliance with AI-powered insights');
    }
    
    // Add RTL support meta tag
    const metaViewport = document.querySelector('meta[name="viewport"]');
    if (metaViewport) {
      metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover');
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="rtl-aware-root" // Add class for RTL awareness
    >
      <LanguageProvider>
        <ContractProvider>
          <MainContent />
        </ContractProvider>
      </LanguageProvider>
    </motion.div>
  );
};

export default Index;
