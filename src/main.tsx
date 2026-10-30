import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext.tsx';
import { LanguageThemeProvider } from './context/LanguageThemeContext.tsx';

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <LanguageThemeProvider>
      <App />
    </LanguageThemeProvider>
  </AuthProvider>
);
