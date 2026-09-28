import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { StockList } from './pages/StockList';
import { StockDetail } from './pages/StockDetail';
import { AdjustStock } from './pages/AdjustStock';
import { Movements } from './pages/Movements';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<StockList />} />
        <Route path="/stock/:productCode/:locationCode" element={<StockDetail />} />
        <Route path="/adjust" element={<AdjustStock />} />
        <Route path="/movements" element={<Movements />} />
      </Routes>
    </Layout>
  );
}
