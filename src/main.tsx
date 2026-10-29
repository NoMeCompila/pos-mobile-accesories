import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './services/supabaseClient';

createRoot(document.getElementById('root')!).render(<App />);
