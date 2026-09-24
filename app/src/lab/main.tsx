import { createRoot } from 'react-dom/client';
import '@fontsource/rajdhani/latin-500.css';
import '@fontsource/rajdhani/latin-600.css';
import '@fontsource/rajdhani/latin-700.css';
import { LabApp } from './LabApp';

createRoot(document.getElementById('root')!).render(<LabApp />);
