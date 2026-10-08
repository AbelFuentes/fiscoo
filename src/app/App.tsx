import { BrowserRouter } from 'react-router-dom';

import { AuthProvider } from '../auth/AuthContext';
import { PreferencesProvider } from '../preferences/PreferencesContext';

import Routes from './routes';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PreferencesProvider>
          <Routes />
        </PreferencesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
