import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ScanLine, Trash2, Plus, Minus, CreditCard, Banknote, Gift, Check, X } from 'lucide-react';
import { retailApi } from '../api/retail';
import { PaymentMethod, RetailPrice, Sale } from '../api/types';
import { useToast } from '../components/ToastProvider';

interface CartLine {
  productCode: string;
  productName: string;
  unitPrice: number;
  quantity: number;
}

const STORE = import.meta.env.VITE_STORE_LOCATION ?? 'Store #1';
const CASHIER = import.meta.env.VITE_CASHIER_ID ?? 'cashier-01';
const TAX_RATE = 0.16;

const fmt = (n: number) => `KES ${n.toFixed(2)}`;

export function Terminal() {
  const { push } = useToast();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [sku, setSku] = useState('');
  const [scanInputRef, setScanInputRef] = useState<HTMLInputElement | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [completed, setCompleted] = useState<Sale | null>(null);
  const [flash, setFlash] = useState<'success' | 'error' | null>(null);
  const [showPay, setShowPay] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: prices } = useQuery({
    queryKey: ['prices'],
    queryFn: () => retailApi.listPrices(),
  });

  useEffect(() => {
    inputRef.current?.focus();
  }, [completed]);

  const lookupPrice = useCallback(async (code: string): Promise<RetailPrice | null> => {
    if (prices) {
      const cached = prices.find((p) => p.productCode.toLowerCase() === code.toLowerCase());
      if (cached) return cached;
    }
    try {
      return await retailApi.getPrice(code);
    } catch {
      return null;
    }
  }, [prices]);

  const addToCart = useCallback(async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    const price = await lookupPrice(trimmed);
    if (!price) {
      push(`Unknown product: ${trimmed}`, 'error');
      setFlash('error');
      setTimeout(() => setFlash(null), 450);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((l) => l.productCode === price.productCode);
      if (existing) {
        return prev.map((l) => l.productCode === price.productCode ? { ...l, quantity: l.quantity + 1 } : l);
      }
      return [...prev, { productCode: price.productCode, productName: price.productName, unitPrice: price.unitPrice, quantity: 1 }];
    });
    push(`Added ${price.productName}`, 'success');
    setFlash('success');
    setTimeout(() => setFlash(null), 300);
    setSku('');
    inputRef.current?.focus();
  }, [lookupPrice, push]);

  const updateQty = (code: string, delta: number) => {
    setCart((prev) => prev
      .map((l) => l.productCode === code ? { ...l, quantity: l.quantity + delta } : l)
      .filter((l) => l.quantity > 0));
  };

  const removeLine = (code: string) => {
    setCart((prev) => prev.filter((l) => l.productCode !== code));
  };

  const clearCart = () => {
    setCart([]);
    setShowPay(false);
    setSku('');
  };

  const subtotal = cart.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const taxTotal = Number((subtotal * TAX_RATE).toFixed(2));
  const grandTotal = Number((subtotal + taxTotal).toFixed(2));

  const checkout = useMutation({
    mutationFn: () => retailApi.createSale({
      storeLocation: STORE,
      cashierId: CASHIER,
      lines: cart.map((l) => ({ productCode: l.productCode, quantity: l.quantity })),
      payments: [{ method: paymentMethod, amount: grandTotal }],
    }),
    onSuccess: (sale) => {
      push(`Sale ${sale.saleNumber} completed`, 'success');
      setCompleted(sale);
      setCart([]);
      setShowPay(false);
    },
    onError: (e: unknown) => {
      push(e instanceof Error ? e.message : 'Checkout failed', 'error');
    },
  });

  const scan = (e: React.FormEvent) => {
    e.preventDefault();
    addToCart(sku);
  };

  if (completed) {
    return <Receipt sale={completed} onNext={() => setCompleted(null)} />;
  }

  return (
    <div className={`pos-grid ${flash === 'success' ? 'flash-success' : flash === 'error' ? 'flash-error' : ''}`}>
      <div>
        <form onSubmit={scan} className="pos-scanner">
          <div className="pos-scanner-wrap">
            <ScanLine className="pos-scanner-icon" size={22} />
            <input
              ref={(el) => { inputRef.current = el; setScanInputRef(el); }}
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="Scan or type SKU + Enter…"
              autoComplete="off"
              spellCheck={false}
              className="pos-scanner-input"
            />
          </div>
          <button type="submit" className="btn-primary" disabled={!sku.trim()}>
            <Plus size={18} /> Add
          </button>
        </form>

        <div className="cart">
          {cart.length === 0 ? (
            <div className="empty">
              <div className="empty-icon"><ScanLine size={30} /></div>
              <div className="empty-title">Ready to scan</div>
              <div className="empty-hint">Scan a product barcode or type a SKU to begin.</div>
            </div>
          ) : (
            <div className="cart-lines">
              {cart.map((line) => (
                <div key={line.productCode} className="cart-line">
                  <div className="cart-line-info">
                    <div className="cart-line-name">{line.productName}</div>
                    <div className="cart-line-sku">{line.productCode} · {fmt(line.unitPrice)} each</div>
                  </div>
                  <div className="cart-line-qty">
                    <button className="cart-qty-btn" onClick={() => updateQty(line.productCode, -1)} aria-label="Decrease">
                      <Minus size={16} />
                    </button>
                    <span className="cart-qty-value">{line.quantity}</span>
                    <button className="cart-qty-btn" onClick={() => updateQty(line.productCode, 1)} aria-label="Increase">
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="cart-line-total">{fmt(line.unitPrice * line.quantity)}</div>
                  <button className="btn-ghost btn-sm" onClick={() => removeLine(line.productCode)} aria-label="Remove">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="totals">
          <div className="totals-row">
            <span>Subtotal</span>
            <span className="value">{fmt(subtotal)}</span>
          </div>
          <div className="totals-row">
            <span>VAT (16%)</span>
            <span className="value">{fmt(taxTotal)}</span>
          </div>
          <div className="totals-row total">
            <span>Total</span>
            <span className="value">{fmt(grandTotal)}</span>
          </div>

          {!showPay ? (
            <button
              className="btn-success btn-lg"
              disabled={cart.length === 0}
              onClick={() => setShowPay(true)}
              style={{ marginTop: 16 }}
            >
              <Check size={20} /> Charge {fmt(grandTotal)}
            </button>
          ) : (
            <>
              <div className="pay-methods">
                <button className={`pay-method ${paymentMethod === 'cash' ? 'selected' : ''}`} onClick={() => setPaymentMethod('cash')}>
                  <Banknote size={22} />
                  Cash
                </button>
                <button className={`pay-method ${paymentMethod === 'card' ? 'selected' : ''}`} onClick={() => setPaymentMethod('card')}>
                  <CreditCard size={22} />
                  Card
                </button>
                <button className={`pay-method ${paymentMethod === 'gift_card' ? 'selected' : ''}`} onClick={() => setPaymentMethod('gift_card')}>
                  <Gift size={22} />
                  Gift
                </button>
              </div>
              <button
                className="btn-success btn-lg"
                disabled={checkout.isPending}
                onClick={() => checkout.mutate()}
                style={{ marginTop: 12 }}
              >
                {checkout.isPending ? 'Processing…' : `Pay ${fmt(grandTotal)}`}
              </button>
              <button className="btn-ghost" onClick={() => setShowPay(false)} style={{ marginTop: 8 }}>
                <X size={16} /> Back
              </button>
            </>
          )}

          {cart.length > 0 && !showPay && (
            <button className="btn-ghost" onClick={clearCart} style={{ marginTop: 8 }}>
              Clear cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Receipt({ sale, onNext }: { sale: Sale; onNext: () => void }) {
  return (
    <div>
      <div className="receipt">
        <div className="receipt-header">
          <h3>POS Terminal</h3>
          <div>{sale.storeLocation}</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>{new Date(sale.completedAt ?? sale.createdAt).toLocaleString()}</div>
        </div>
        <div style={{ fontSize: 12, marginBottom: 12 }}>Sale #{sale.saleNumber}</div>
        {sale.lines?.map((l) => (
          <div key={l.id} className="receipt-line">
            <span>{l.quantity} × {l.productName}</span>
            <span>KES {l.lineTotal.toFixed(2)}</span>
          </div>
        ))}
        <div className="receipt-line" style={{ marginTop: 12 }}>
          <span>Subtotal</span>
          <span>KES {sale.subtotal.toFixed(2)}</span>
        </div>
        <div className="receipt-line">
          <span>VAT</span>
          <span>KES {sale.taxTotal.toFixed(2)}</span>
        </div>
        <div className="receipt-line total">
          <span>TOTAL</span>
          <span>KES {sale.grandTotal.toFixed(2)}</span>
        </div>
        {sale.payments?.map((p) => (
          <div key={p.id} className="receipt-line">
            <span>Paid ({p.method})</span>
            <span>KES {p.amount.toFixed(2)}</span>
          </div>
        ))}
        <div className="receipt-footer">
          Thank you — come again
        </div>
      </div>

      <div style={{ maxWidth: 420, margin: '20px auto 0' }}>
        <button className="btn-primary btn-lg" onClick={onNext}>
          Start next sale
        </button>
      </div>
    </div>
  );
}
