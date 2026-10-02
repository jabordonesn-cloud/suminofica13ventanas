import { useState, useMemo, useRef } from 'react';
import {
  ShoppingCart,
  ScanLine,
  Trash2,
  X,
  Package as PackageIcon,
  DollarSign,
  CircleDollarSign,
  CreditCard,
  Banknote,
  Smartphone,
  Users as UsersIcon,
  Check,
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import type { CartItem, PaymentMethod } from '@/types/product';

function safeNum(v: string | number, fallback = 0): number {
  const n = typeof v === 'number' ? v : parseFloat(v);
  return isNaN(n) ? fallback : n;
}

function priceSell(p: { priceBuy: number; gainPct: number }): number {
  const buy = safeNum(p.priceBuy);
  const gain = safeNum(p.gainPct);
  return buy + buy * (gain / 100);
}

export default function Ventas() {
  const { products, tasaBs, tasaPts, reduceStock } = useStore();

  const [scanner, setScanner] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [bultoItem, setBultoItem] = useState<CartItem | null>(null);
  const [bultoPrice, setBultoPrice] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('divisas');
  const [amountPaid, setAmountPaid] = useState('');
  const [refNumber, setRefNumber] = useState('');
  const [saleComplete, setSaleComplete] = useState(false);

  const scannerRef = useRef<HTMLInputElement>(null);

  // Add product to cart via scanner
  const handleScanner = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const q = scanner.trim();
    if (!q) return;

    const found = products.find(
      (p) => p.barcode.toLowerCase() === q.toLowerCase() || p.name.toLowerCase().includes(q.toLowerCase()),
    );
    if (found) {
      const existing = cart.find((c) => c.product.id === found.id);
      if (existing) {
        setCart(cart.map((c) =>
          c.product.id === found.id ? { ...c, quantity: c.quantity + 1 } : c,
        ));
      } else {
        setCart([...cart, { product: found, quantity: 1, bultoPrice: null }]);
      }
    }
    setScanner('');
    scannerRef.current?.focus();
  };

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) {
      setCart(cart.filter((c) => c.product.id !== id));
      return;
    }
    setCart(cart.map((c) => (c.product.id === id ? { ...c, quantity: qty } : c)));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter((c) => c.product.id !== id));
  };

  // Totals
  const totals = useMemo(() => {
    const totalUsd = cart.reduce((sum, item) => {
      const unit = item.bultoPrice !== null ? safeNum(item.bultoPrice) : priceSell(item.product);
      return sum + unit * item.quantity;
    }, 0);
    const totalBs = totalUsd * safeNum(tasaBs, 1);
    const totalPts = totalBs * safeNum(tasaPts, 1);
    return { totalUsd, totalBs, totalPts };
  }, [cart, tasaBs, tasaPts]);

  const change = useMemo(() => {
    const paid = safeNum(amountPaid);
    return Math.max(0, paid - totals.totalUsd);
  }, [amountPaid, totals.totalUsd]);

  const canProcess = useMemo(() => {
    if (cart.length === 0) return false;
    if (paymentMethod === 'movil' && !refNumber.trim()) return false;
    if (paymentMethod !== 'deudores' && safeNum(amountPaid) < totals.totalUsd) return false;
    return true;
  }, [cart, paymentMethod, refNumber, amountPaid, totals.totalUsd]);

  const handleProcessSale = () => {
    if (!canProcess) return;
    // Reduce stock for each item
    cart.forEach((item) => {
      reduceStock(item.product.id, item.quantity);
    });

    if (paymentMethod === 'deudores') {
      // Simulate sending to Deudores window (Ventana 3)
      console.log('Venta enviada a Deudores:', cart);
    }

    setSaleComplete(true);
    setTimeout(() => {
      setCart([]);
      setAmountPaid('');
      setRefNumber('');
      setPaymentMethod('divisas');
      setSaleComplete(false);
      scannerRef.current?.focus();
    }, 2500);
  };

  const handleBultoConfirm = () => {
    if (bultoItem) {
      const price = safeNum(bultoPrice);
      setCart(cart.map((c) =>
        c.product.id === bultoItem.product.id
          ? { ...c, bultoPrice: price > 0 ? price : null }
          : c,
      ));
    }
    setBultoItem(null);
    setBultoPrice('');
  };

  const paymentOptions: { value: PaymentMethod; label: string; icon: typeof CreditCard }[] = [
    { value: 'divisas', label: 'Divisas', icon: DollarSign },
    { value: 'efectivo', label: 'Efectivo', icon: Banknote },
    { value: 'punto', label: 'Punto de Venta', icon: CreditCard },
    { value: 'movil', label: 'Pago Móvil', icon: Smartphone },
    { value: 'deudores', label: 'Deudores', icon: UsersIcon },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <ShoppingCart className="w-4 h-4 text-gold-500" />
        <span className="text-gold-500 font-medium">Módulo 2</span>
        <span>/</span>
        <span className="text-gray-600">Ventas</span>
      </div>

      {/* Giant scanner */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 mb-4">
        <div className="relative">
          <ScanLine className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gold-400" />
          <input
            ref={scannerRef}
            type="text"
            value={scanner}
            onChange={(e) => setScanner(e.target.value)}
            onKeyDown={handleScanner}
            placeholder="Pase el lector de código de barras o escriba el nombre del producto..."
            className="w-full pl-13 pr-4 py-4 text-lg border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
            style={{ paddingLeft: '3.5rem' }}
            autoFocus
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cart table - spans 2 columns */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-gold-300 via-gold-400 to-gold-500" />
          <div className="p-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Carrito de Compras</h2>
            <span className="text-xs text-gray-400">{cart.length} producto(s)</span>
          </div>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gold-50 z-10">
                <tr className="text-gray-600 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3 font-semibold">Producto</th>
                  <th className="text-center px-4 py-3 font-semibold">Precio Unit.</th>
                  <th className="text-center px-4 py-3 font-semibold">Cantidad</th>
                  <th className="text-right px-4 py-3 font-semibold">Subtotal</th>
                  <th className="text-center px-4 py-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-gray-400">
                      <PackageIcon className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                      <p className="text-sm">Escanee un producto para comenzar la venta</p>
                    </td>
                  </tr>
                )}
                {cart.map((item) => {
                  const unit = item.bultoPrice !== null ? safeNum(item.bultoPrice) : priceSell(item.product);
                  const subtotal = unit * item.quantity;
                  return (
                    <tr key={item.product.id} className="border-t border-gray-50 hover:bg-gray-50/30">
                      <td
                        className="px-4 py-3 font-medium text-gray-700 cursor-pointer select-none"
                        onDoubleClick={() => {
                          setBultoItem(item);
                          setBultoPrice(String(unit.toFixed(2)));
                        }}
                        title="Doble clic para precio de bulto"
                      >
                        {item.product.name}
                        {item.bultoPrice !== null && (
                          <span className="ml-2 text-xs bg-gold-100 text-gold-500 px-1.5 py-0.5 rounded-full">
                            Bulto
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        ${unit.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateQty(item.product.id, safeNum(e.target.value, 1))}
                          className="w-16 text-center px-1 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gold-400"
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800">
                        ${subtotal.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right panel: totals + payment */}
        <div className="space-y-4">
          {/* Totals */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-gold-300 via-gold-400 to-gold-500" />
            <div className="p-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Totales</h2>
              <div className="space-y-2">
                <div className="bg-gray-50 rounded-lg px-4 py-3 flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">Total en $</span>
                  <span className="text-xl font-bold text-gray-800">${totals.totalUsd.toFixed(2)}</span>
                </div>
                <div className="bg-gold-50 rounded-lg px-4 py-3 flex items-center justify-between">
                  <span className="text-xs text-gold-500 font-medium">Total en Bolívares</span>
                  <span className="text-lg font-bold text-gold-500">
                    Bs {totals.totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="bg-emerald-50 rounded-lg px-4 py-3 flex items-center justify-between">
                  <span className="text-xs text-emerald-600 font-medium">Total en $$</span>
                  <span className="text-lg font-bold text-emerald-600">
                    $$ {totals.totalPts.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment panel */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-gold-300 via-gold-400 to-gold-500" />
            <div className="p-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Panel de Pago</h2>

              {/* Payment method selector */}
              <div className="space-y-2 mb-4">
                {paymentOptions.map((opt) => {
                  const Icon = opt.icon;
                  const active = paymentMethod === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setPaymentMethod(opt.value);
                        setAmountPaid('');
                        setRefNumber('');
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all
                        ${active
                          ? 'border-gold-400 bg-gold-50 text-gold-500'
                          : 'border-gray-200 text-gray-600 hover:border-gold-300'
                        }`}
                    >
                      <Icon className="w-4 h-4" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {/* Pago Móvil reference */}
              {paymentMethod === 'movil' && (
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Nro. de Referencia <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={refNumber}
                    onChange={(e) => setRefNumber(e.target.value)}
                    placeholder="Ej: 001234567890"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                    required
                  />
                </div>
              )}

              {/* Amount paid (not for deudores) */}
              {paymentMethod !== 'deudores' && (
                <>
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Monto Recibido
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                    />
                  </div>
                  <div className="bg-gold-50 rounded-lg px-3 py-2 flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-500">Cambio / Vuelto</span>
                    <span className="text-sm font-bold text-gold-500">
                      ${change.toFixed(2)}
                    </span>
                  </div>
                </>
              )}

              {/* Deudores info */}
              {paymentMethod === 'deudores' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3 text-xs text-amber-700">
                  La venta se enviará a Deudores. No se suman ganancias, solo se descuenta del inventario.
                </div>
              )}

              {/* Process button */}
              <button
                onClick={handleProcessSale}
                disabled={!canProcess}
                className={`w-full font-semibold py-3 rounded-lg transition-all
                  ${canProcess
                    ? 'bg-gold-400 hover:bg-gold-500 text-white shadow-gold-sm'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
              >
                Procesar Venta
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bulto modal */}
      {bultoItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm relative">
            <button
              onClick={() => {
                setBultoItem(null);
                setBultoPrice('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gold-50 rounded-full mb-4">
                <PackageIcon className="w-7 h-7 text-gold-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800 mb-1">¿Cambiar a precio de Bulto?</h2>
              <p className="text-sm text-gray-500 mb-4">{bultoItem.product.name}</p>

              <div className="mb-6">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Nuevo precio de bulto ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={bultoPrice}
                  onChange={(e) => setBultoPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setBultoItem(null);
                    setBultoPrice('');
                  }}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  NO
                </button>
                <button
                  onClick={handleBultoConfirm}
                  className="flex-1 py-2.5 bg-gold-400 hover:bg-gold-500 text-white font-semibold rounded-lg transition-colors"
                >
                  SÍ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sale complete confirmation */}
      {saleComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
              <Check className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-1">¡Venta Procesada!</h2>
            <p className="text-sm text-gray-500">
              {paymentMethod === 'deudores'
                ? 'Enviada a Deudores. Inventario actualizado.'
                : 'Inventario actualizado correctamente.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
