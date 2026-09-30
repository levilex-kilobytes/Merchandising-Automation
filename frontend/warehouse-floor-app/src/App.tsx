import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { PutawayList } from './pages/PutawayList';
import { PutawayDetail } from './pages/PutawayDetail';
import { PickList } from './pages/PickList';
import { PickDetail } from './pages/PickDetail';
import { TransferList } from './pages/TransferList';
import { TransferCreate } from './pages/TransferCreate';
import { Lookup } from './pages/Lookup';
import { ZoneCapacity } from './pages/ZoneCapacity';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<PutawayList />} />
        <Route path="/putaway/:id" element={<PutawayDetail />} />
        <Route path="/pick" element={<PickList />} />
        <Route path="/pick/:id" element={<PickDetail />} />
        <Route path="/transfers" element={<TransferList />} />
        <Route path="/transfers/new" element={<TransferCreate />} />
        <Route path="/lookup" element={<Lookup />} />
        <Route path="/zones" element={<ZoneCapacity />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
