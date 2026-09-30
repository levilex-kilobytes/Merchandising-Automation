const INVENTORY_API = import.meta.env.VITE_INVENTORY_API_URL ?? 'http://localhost:3004/api/v1';
const WAREHOUSE_API = import.meta.env.VITE_API_URL ?? 'http://localhost:3005/api/v1';

interface StockRow {
  id: string;
  productCode: string;
  productName: string;
  locationCode: string;
  onHand: number;
  available: number;
  allocated: number;
  unitCost: number;
}

interface LocationRow {
  id: string;
  code: string;
  zone: string;
  aisle: string;
  rack: string;
  shelf: string;
  bin: string;
  capacity: number;
  used: number;
}

export interface LookupResult {
  bin: {
    code: string;
    zone: string;
    aisle: string;
    rack: string;
    shelf: string;
    capacity: number;
    used: number;
  };
  quantity: number;
  productName: string;
}

export async function findBySku(sku: string): Promise<LookupResult[]> {
  const stockRes = await fetch(`${INVENTORY_API}/stock`);
  if (!stockRes.ok) throw new Error(`Inventory error: ${stockRes.status}`);
  const stock = (await stockRes.json()) as StockRow[];

  const matches = stock.filter(
    (s) => s.productCode.toLowerCase() === sku.trim().toLowerCase() && s.onHand > 0,
  );
  if (matches.length === 0) return [];

  const locRes = await fetch(`${WAREHOUSE_API}/locations`);
  if (!locRes.ok) throw new Error(`Warehouse error: ${locRes.status}`);
  const locations = (await locRes.json()) as LocationRow[];

  const byCode = new Map(locations.map((l) => [l.code, l]));

  return matches.map((m) => {
    const loc = byCode.get(m.locationCode);
    return {
      bin: {
        code: m.locationCode,
        zone: loc?.zone ?? '—',
        aisle: loc?.aisle ?? '—',
        rack: loc?.rack ?? '—',
        shelf: loc?.shelf ?? '—',
        capacity: loc?.capacity ?? 0,
        used: loc?.used ?? 0,
      },
      quantity: m.onHand,
      productName: m.productName,
    };
  });
}
