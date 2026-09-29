import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { PurchaseOrders } from './pages/PurchaseOrders';
import { Analytics } from './pages/Analytics';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<PurchaseOrders />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
