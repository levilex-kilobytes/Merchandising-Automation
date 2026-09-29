import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { SessionsList } from './pages/SessionsList';
import { ReconcileSession } from './pages/ReconcileSession';
import { Discrepancies } from './pages/Discrepancies';
import { Analytics } from './pages/Analytics';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<SessionsList />} />
        <Route path="/reconcile/:id" element={<ReconcileSession />} />
        <Route path="/discrepancies" element={<Discrepancies />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
