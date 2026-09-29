import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Terminal } from './pages/Terminal';
import { SalesList } from './pages/SalesList';
import { ReturnsList } from './pages/ReturnsList';
import { PricesList } from './pages/PricesList';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Terminal />} />
        <Route path="/sales" element={<SalesList />} />
        <Route path="/returns" element={<ReturnsList />} />
        <Route path="/prices" element={<PricesList />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
