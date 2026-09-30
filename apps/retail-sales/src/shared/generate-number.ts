export function generateSaleNumber(): string {
  const d = new Date();
  const ymd = d.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 900000 + 100000);
  return `S-${ymd}-${rand}`;
}

export function generateReturnNumber(): string {
  const d = new Date();
  const ymd = d.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 900000 + 100000);
  return `R-${ymd}-${rand}`;
}
