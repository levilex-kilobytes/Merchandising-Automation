import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { GRNList } from './pages/GRNList';
import { GRNDetail } from './pages/GRNDetail';
import { ReceiveDelivery } from './pages/ReceiveDelivery';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<GRNList />} />
        <Route path="/receive" element={<ReceiveDelivery />} />
        <Route path="/grns/:id" element={<GRNDetail />} />
      </Routes>
    </Layout>
  );
}
