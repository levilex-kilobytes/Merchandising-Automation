import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Stock } from './pages/Stock';
import { Movements } from './pages/Movements';
import { Locations } from './pages/Locations';
import { LowStock } from './pages/LowStock';
import { Analytics } from './pages/Analytics';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Stock />} />
        <Route path="/movements" element={<Movements />} />
        <Route path="/locations" element={<Locations />} />
        <Route path="/low-stock" element={<LowStock />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
