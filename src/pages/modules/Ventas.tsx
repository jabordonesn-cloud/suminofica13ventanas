import { useState, useMemo, useRef } from 'react';
import {
  ShoppingCart,
  ScanLine,
  Trash2,
  X,
  Package as PackageIcon,
  DollarSign,
  CreditCard,
  Banknote,
  Smartphone,
  Users as UsersIcon,
  Check,
  Layers,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import type { CartItem, PaymentMethod, Product } from '@/types/product';

function safeNum(v: string | number | undefined, fallback = 0): number {
  if (v === undefined) return fallback;
  const n = typeof v === 'number' ? v : parseFloat(v);
  return isNaN(n) ? fallback : n;
}

function priceSell(p: Product): number {
  const buy = safeNum(p.priceBuy);
  const gain = safeNum(p.gainPct);
  return buy + buy * (gain / 100);
}

function getUnitPrice(item: CartItem): number {
  if (item.isBulto) {
    return safeNum(item.product.precioBulto) > 0 ? safeNum(item.product.precioBulto) : priceSell(item.product);
  }
  if (!item.isBulto && item.quantity >= 6 && safeNum(item.product.precioMayor) > 0) {
    return safeNum(item.product.precioMayor);
  }
  return priceSell(item.product);
}

const MAYOR_THRESHOLD = 6;

export default function Ventas() {
  const { products, tasaBs, tasaPts, reduceStock } = useStore();

  const [scanner, setScanner] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [bultoItem, setBultoItem] = useState<CartItem | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('divisas');
  const [amountPaid, setAmountPaid] = useState('');
  const [refNumber, setRefNumber] = useState('');
  const [saleComplete, setSaleComplete] = useState(false);

  const [combinedUsd, setCombinedUsd] = useState('');
  const [combinedBs, setCombinedBs] = useState('');

  const [deudorName, setDeudorName] = useState('');
  const [showDeudorModal, setShowDeudorModal] = useState(false);

  const scannerRef = useRef<HTMLInputElement>(null);

  const getProductStock = (id: string): number => {
    const p = products.find((pr) => pr.id === id);
    return p ? p.stock : 0;
  };

  const handleScanner = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const q = scanner.trim();
    if (!q) return;

    const found = products.find(
      (p) => p.barcode.toLowerCase() === q.toLowerCase() || p.name.toLowerCase().includes(q.toLowerCase()),
    );
    if (found) {
      const existing = cart.find((c) => c.product.id === found.id);
      if (existing && !existing.isBulto) {
        setCart(cart.map((c) =>
          c.product.id === found.id ? { ...c, quantity: c.quantity + 1 } : c,
        ));
      } else {
        setCart([...cart, { product: found, quantity: 1, isBulto: false }]);
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

  const hasStockIssues = useMemo(() => {
    return cart.some((item) => item.quantity > getProductStock(item.product.id));
  }, [cart, products]);

  const totals = useMemo(() => {
    const totalUsd = cart.reduce((sum, item) => {
      return sum + getUnitPrice(item) * item.quantity;
    }, 0);
    const totalBs = totalUsd * safeNum(tasaBs, 1);
    const totalPts = totalBs / (safeNum(tasaPts, 1) || 1);
    return { totalUsd, totalBs, totalPts };
  }, [cart, tasaBs, tasaPts]);

  const change = useMemo(() => {
    if (paymentMethod === 'combinado') {
      const usdPaid = safeNum(combinedUsd);
      const bsPaid = safeNum(combinedBs);
      const bsInUsd = safeNum(tasaBs, 1) > 0 ? bsPaid / safeNum(tasaBs, 1) : 0;
      const totalPaidUsd = usdPaid + bsInUsd;
      const diff = totalPaidUsd - totals.totalUsd;
      return { diffUsd: diff, diffBs: diff * safeNum(tasaBs, 1), isShort: diff < 0 };
    }
    const paid = safeNum(amountPaid);
    const diff = paid - totals.totalUsd;
    return { diffUsd: diff, diffBs: diff * safeNum(tasaBs, 1), isShort: diff < 0 };
  }, [paymentMethod, amountPaid, combinedUsd, combinedBs, totals.totalUsd, tasaBs]);

  const canProcess = useMemo(() => {
    if (cart.length === 0) return false;
    if (hasStockIssues) return false;
    if (paymentMethod === 'movil' && !refNumber.trim()) return false;
    if (paymentMethod === 'combinado') return !change.isShort;
    if (paymentMethod !== 'deudores' && safeNum(amountPaid) < totals.totalUsd) return false;
    return true;
  }, [cart, hasStockIssues, paymentMethod, refNumber, amountPaid, totals.totalUsd, change.isShort]);

  const resetSale = () => {
    setCart([]);
    setAmountPaid('');
    setRefNumber('');
    setCombinedUsd('');
    setCombinedBs('');
    setPaymentMethod('divisas');
    setSaleComplete(false);
    setDeudorName('');
    scannerRef.current?.focus();
  };

  const handleProcessSale = () => {
    if (!canProcess) return;
    cart.forEach((item) => reduceStock(item.product.id, item.quantity));
    setSaleComplete(true);
    setTimeout(resetSale, 2500);
  };

  const handleSendToDeudores = () => {
    if (!deudorName.trim() || cart.length === 0 || hasStockIssues) return;
    cart.forEach((item) => reduceStock(item.product.id, item.quantity));
    setShowDeudorModal(false);
    setSaleComplete(true);
    setTimeout(resetSale, 2500);
  };

  const handleBultoApply = () => {
    if (bultoItem) {
      setCart(cart.map((c) =>
        c.product.id === bultoItem.product.id
          ? { ...c, isBulto: true, quantity: 1 }
          : c,
      ));
    }
    setBultoItem(null);
  };

  const handleBultoRemove = (id: string) => {
    setCart(cart.map((c) =>
      c.product.id === id ? { ...c, isBulto: false } : c,
    ));
  };

  const paymentOptions: { value: PaymentMethod; label: string; icon: typeof CreditCard }[] = [
    { value: 'divisas', label: 'Divisas', icon: DollarSign },
    { value: 'efectivo', label: 'Efectivo', icon: Banknote },
    { value: 'punto', label: 'Punto', icon: CreditCard },
    { value: 'movil', label: 'Pago Móvil', icon: Smartphone },
    { value: 'combinado', label: 'Combinado', icon: Layers },
    { value: 'deudores', label: 'Deudores', icon: UsersIcon },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <ShoppingCart className="w-4 h-4 text-gold-500" />
        <span className="text-gold-500 font-medium">Módulo 2</span>
        <span>/</span>
        <span className="text-gray-600">Punto de Venta</span>
      </div>

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
            className="w-full pr-4 py-4 text-lg border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
            style={{ paddingLeft: '3.5rem' }}
            autoFocus
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cart */}
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
                  const unit = getUnitPrice(item);
                  const unitBs = unit * safeNum(tasaBs, 1);
                  const subtotal = unit * item.quantity;
                  const currentStock = getProductStock(item.product.id);
                  const isOverStock = item.quantity > currentStock;
                  const isMayor = !item.isBulto && item.quantity >= MAYOR_THRESHOLD && safeNum(item.product.precioMayor) > 0;

                  return (
                    <tr key={item.product.id} className={`border-t border-gray-50 ${isOverStock ? 'bg-red-50/30' : 'hover:bg-gray-50/30'}`}>
                      <td
                        className="px-4 py-3 font-medium text-gray-700 cursor-pointer select-none"
                        onDoubleClick={() => {
                          if (item.isBulto) {
                            handleBultoRemove(item.product.id);
                          } else {
                            setBultoItem(item);
                          }
                        }}
                        title={item.isBulto ? 'Doble clic para quitar bulto' : 'Doble clic para facturar bulto'}
                      >
                        {item.product.name}
                        {item.isBulto && (
                          <span className="ml-2 text-xs bg-gold-100 text-gold-700 px-1.5 py-0.5 rounded-full font-semibold">
                            (Bulto)
                          </span>
                        )}
                        {!item.isBulto && isMayor && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold">
                            (Mayor)
                          </span>
                        )}
                        <span className="block text-xs text-gray-400 mt-0.5">
                          Stock: {currentStock} und.
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        <div className="font-semibold">${unit.toFixed(2)}</div>
                        <div className="text-xs text-gray-400">
                          Bs {unitBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateQty(item.product.id, safeNum(e.target.value, 1))}
                          className={`w-20 text-center px-2 py-1.5 border rounded text-sm font-medium transition-colors
                            ${isOverStock
                              ? 'text-red-600 font-bold border-red-500 bg-red-50'
                              : 'border-gray-200 bg-gray-50 hover:bg-gold-50 text-gray-700 focus:outline-none focus:ring-1 focus:ring-gold-400'
                            }`}
                        />
                        {isOverStock && (
                          <div className="flex items-center justify-center gap-1 mt-1 text-red-500">
                            <AlertTriangle className="w-3 h-3" />
                            <span className="text-xs font-medium">Supera stock</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800">
                        ${subtotal.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
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

        {/* Right panel */}
        <div className="space-y-4">
          {/* Totals */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-gold-300 via-gold-400 to-gold-500" />
            <div className="p-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Total a Pagar</h2>
              <div className="space-y-2">
                <div className="bg-gray-50 rounded-lg px-4 py-3 flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">Total en $</span>
                  <span className="text-2xl font-bold text-gray-800">${totals.totalUsd.toFixed(2)}</span>
                </div>
                <div className="bg-gold-50 rounded-lg px-4 py-3 flex items-center justify-between">
                  <span className="text-xs text-gold-600 font-medium">Total en Bolívares</span>
                  <span className="text-lg font-bold text-gold-600">
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
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Método de Pago</h2>

              <div className="grid grid-cols-2 gap-2 mb-4">
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
                        setCombinedUsd('');
                        setCombinedBs('');
                      }}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all
                        ${active
                          ? 'border-gold-400 bg-gold-50 text-gold-600'
                          : 'border-gray-200 text-gray-600 hover:border-gold-300'
                        }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{opt.label}</span>
                    </button>
                  );
                })}
              </div>

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
                  />
                </div>
              )}

              {paymentMethod === 'combinado' && (
                <div className="space-y-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      ¿Entregó en Divisas ($)?
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={combinedUsd}
                      onChange={(e) => setCombinedUsd(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      ¿Entregó en Efectivo Bs?
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={combinedBs}
                      onChange={(e) => setCombinedBs(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                    />
                  </div>
                  <div className={`rounded-lg px-3 py-2.5 flex items-center justify-between ${change.isShort ? 'bg-red-50' : 'bg-emerald-50'}`}>
                    <span className={`text-xs font-medium ${change.isShort ? 'text-red-600' : 'text-emerald-600'}`}>
                      {change.isShort ? 'Faltante a Pagar' : 'Vuelto a Entregar'}
                    </span>
                    <div className="text-right">
                      <span className={`text-sm font-bold block ${change.isShort ? 'text-red-600' : 'text-emerald-600'}`}>
                        ${Math.abs(change.diffUsd).toFixed(2)}
                      </span>
                      <span className={`text-xs ${change.isShort ? 'text-red-500' : 'text-emerald-500'}`}>
                        Bs {Math.abs(change.diffBs).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod !== 'deudores' && paymentMethod !== 'combinado' && (
                <>
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Monto Recibido ($)
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
                  {safeNum(amountPaid) > 0 && (
                    <div className={`rounded-lg px-3 py-2.5 flex items-center justify-between mb-3 ${change.isShort ? 'bg-red-50' : 'bg-emerald-50'}`}>
                      <span className={`text-xs font-medium ${change.isShort ? 'text-red-600' : 'text-emerald-600'}`}>
                        {change.isShort ? 'Faltante' : 'Vuelto'}
                      </span>
                      <div className="text-right">
                        <span className={`text-sm font-bold block ${change.isShort ? 'text-red-600' : 'text-emerald-600'}`}>
                          ${Math.abs(change.diffUsd).toFixed(2)}
                        </span>
                        <span className={`text-xs ${change.isShort ? 'text-red-500' : 'text-emerald-500'}`}>
                          Bs {Math.abs(change.diffBs).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {paymentMethod === 'deudores' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 mb-3 text-xs text-amber-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>La venta se enviará a Deudores. Se descuenta el inventario pero no se registran ganancias.</span>
                </div>
              )}

              {/* Stock warning */}
              {hasStockIssues && paymentMethod !== 'deudores' && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 mb-3 text-xs text-red-600 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>No se puede confirmar: hay productos que superan el stock disponible.</span>
                </div>
              )}

              {/* Action buttons */}
              {paymentMethod === 'deudores' ? (
                <button
                  onClick={() => { if (cart.length > 0 && !hasStockIssues) setShowDeudorModal(true); }}
                  disabled={cart.length === 0 || hasStockIssues}
                  className={`w-full flex items-center justify-center gap-2 font-semibold py-3.5 rounded-lg transition-all text-base
                    ${cart.length > 0 && !hasStockIssues
                      ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                >
                  <UsersIcon className="w-5 h-5" />
                  Enviar a Deudores
                </button>
              ) : (
                <button
                  onClick={handleProcessSale}
                  disabled={!canProcess}
                  className={`w-full flex items-center justify-center gap-2 font-semibold py-3.5 rounded-lg transition-all text-base
                    ${canProcess
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                >
                  <Check className="w-5 h-5" />
                  Confirmar Venta
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bulto modal */}
      {bultoItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm relative">
            <button
              onClick={() => setBultoItem(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gold-50 rounded-full mb-4">
                <Layers className="w-7 h-7 text-gold-500" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800 mb-1">¿Desea facturar un Bulto?</h2>
              <p className="text-sm text-gray-500 mb-4">{bultoItem.product.name}</p>
              {safeNum(bultoItem.product.precioBulto) > 0 ? (
                <div className="bg-gold-50 rounded-lg px-4 py-3 mb-6">
                  <p className="text-xs text-gray-500 mb-1">Precio por bulto</p>
                  <p className="text-2xl font-bold text-gold-600">
                    ${safeNum(bultoItem.product.precioBulto).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Precio normal: ${priceSell(bultoItem.product).toFixed(2)}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-400 mb-6">Este producto no tiene precio de bulto configurado.</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setBultoItem(null)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  NO
                </button>
                <button
                  onClick={handleBultoApply}
                  disabled={safeNum(bultoItem.product.precioBulto) <= 0}
                  className={`flex-1 py-2.5 font-semibold rounded-lg transition-colors
                    ${safeNum(bultoItem.product.precioBulto) > 0
                      ? 'bg-gold-400 hover:bg-gold-500 text-white'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                >
                  SÍ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deudores modal */}
      {showDeudorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm relative">
            <button
              onClick={() => setShowDeudorModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-100 rounded-full mb-4">
                <UsersIcon className="w-7 h-7 text-orange-500" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800 mb-1">Enviar a Deudores</h2>
              <p className="text-sm text-gray-500 mb-4">Total: ${totals.totalUsd.toFixed(2)}</p>
              <div className="mb-6 text-left">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Nombre del Deudor <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={deudorName}
                  onChange={(e) => setDeudorName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeudorModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSendToDeudores}
                  disabled={!deudorName.trim()}
                  className={`flex-1 py-2.5 font-semibold rounded-lg transition-colors
                    ${deudorName.trim()
                      ? 'bg-orange-500 hover:bg-orange-600 text-white'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sale complete */}
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
