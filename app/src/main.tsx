import { createRoot } from 'react-dom/client';
import '@fontsource/rajdhani/latin-500.css';
import '@fontsource/rajdhani/latin-600.css';
import '@fontsource/rajdhani/latin-700.css';
import { SpikeApp } from './spike/SpikeApp';

createRoot(document.getElementById('root')!).render(<SpikeApp />);
