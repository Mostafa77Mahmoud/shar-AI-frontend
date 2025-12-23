
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

const Login: React.FC = () => {
  const { t, dir } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate login process
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: t('login.success'),
        description: t('login.successMessage'),
      });
      navigate('/');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir={dir}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-lg border-t-4 border-t-shariah-green dark:border-t-green-600 overflow-hidden">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-2">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FileText className="h-12 w-12 text-shariah-green dark:text-green-400" />
              </motion.div>
            </div>
            <CardTitle className="text-2xl">{t('login.title') || 'Shariaa Analyzer V1'}</CardTitle>
            <CardDescription>{t('login.subtitle') || 'Sign in to your account'}</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  {t('login.email') || 'Email'}
                </label>
                <Input 
                  id="email" 
                  placeholder={t('login.emailPlaceholder') || 'name@example.com'} 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium">
                    {t('login.password') || 'Password'}
                  </label>
                  <a 
                    href="#" 
                    className="text-xs text-shariah-green hover:underline dark:text-green-400"
                  >
                    {t('login.forgot') || 'Forgot password?'}
                  </a>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder={t('login.passwordPlaceholder') || '••••••••'} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-background"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full bg-shariah-green hover:bg-shariah-green/90 dark:bg-green-600 dark:hover:bg-green-700 gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('login.loggingIn') || 'Signing in...'}
                  </>
                ) : (
                  <>
                    <LogIn size={16} />
                    {t('login.signIn') || 'Sign in'}
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
          <div className="px-8 pb-6 text-center text-sm">
            {t('login.noAccount') || "Don't have an account?"}{' '}
            <a href="#" className="text-shariah-green hover:underline dark:text-green-400">
              {t('login.register') || 'Register'}
            </a>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;
