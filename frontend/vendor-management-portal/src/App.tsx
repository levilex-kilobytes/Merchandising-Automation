import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Vendors } from './pages/Vendors';
import { Products } from './pages/Products';
import { Analytics } from './pages/Analytics';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Vendors />} />
        <Route path="/products" element={<Products />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
