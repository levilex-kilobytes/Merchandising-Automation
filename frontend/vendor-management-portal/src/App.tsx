import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { SupplierList } from './pages/SupplierList';
import { SupplierDetail } from './pages/SupplierDetail';
import { CreateSupplier } from './pages/CreateSupplier';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<SupplierList />} />
        <Route path="/suppliers/new" element={<CreateSupplier />} />
        <Route path="/suppliers/:id" element={<SupplierDetail />} />
      </Routes>
    </Layout>
  );
}
