import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { GRNList } from './pages/GRNList';
import { GRNDetail } from './pages/GRNDetail';
export default function App() {
  return <Layout><Routes>
    <Route path="/" element={<GRNList />} />
    <Route path="/grn/:id" element={<GRNDetail />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Layout>;
}
