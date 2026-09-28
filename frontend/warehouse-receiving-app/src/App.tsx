import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { GoodsReceivedNoteList } from './pages/GoodsReceivedNoteList';
import { GoodsReceivedNoteDetail } from './pages/GoodsReceivedNoteDetail';
import { ReceiveDelivery } from './pages/ReceiveDelivery';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<GoodsReceivedNoteList />} />
        <Route path="/receive" element={<ReceiveDelivery />} />
        <Route path="/grns/:id" element={<GoodsReceivedNoteDetail />} />
      </Routes>
    </Layout>
  );
}
