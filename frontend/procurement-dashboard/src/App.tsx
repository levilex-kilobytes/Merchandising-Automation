import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { POList } from './pages/POList';
import { PODetail } from './pages/PODetail';
import { CreatePO } from './pages/CreatePO';
import { ApprovalQueue } from './pages/ApprovalQueue';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<POList />} />
        <Route path="/purchase-orders/new" element={<CreatePO />} />
        <Route path="/purchase-orders/:id" element={<PODetail />} />
        <Route path="/approvals" element={<ApprovalQueue />} />
      </Routes>
    </Layout>
  );
}
