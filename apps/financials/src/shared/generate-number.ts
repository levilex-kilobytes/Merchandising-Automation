export function generateEntryNumber(): string {
  const d = new Date();
  const ymd = d.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 900000 + 100000);
  return `JE-${ymd}-${rand}`;
}
export function generateBillNumber(): string {
  const d = new Date();
  const ymd = d.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 900000 + 100000);
  return `BILL-${ymd}-${rand}`;
}
