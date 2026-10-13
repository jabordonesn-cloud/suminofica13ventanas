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

const BULTO_DISCOUNT = 0.15;

export default function Ventas() {
  const { products, tasaBs, tasaPts, reduceStock } = useStore();

  const [scanner, setScanner] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [bultoItem, setBultoItem] = useState<CartItem | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('divisas');
  const [amountPaid, setAmountPaid] = useState('');
  const [refNumber, setRefNumber] = useState('');
  const [saleComplete, setSaleComplete] = useState(false);

  // Pago Combinado
  const [combinedUsd, setCombinedUsd] = useState('');
  const [combinedBs, setCombinedBs] = useState('');

  // Deudores
  const [deudorName, setDeudorName] = useState('');
  const [showDeudorModal, setShowDeudorModal] = useState(false);

  const scannerRef = useRef<HTMLInputElement>(null);

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

  const totals = useMemo(() => {
    const totalUsd = cart.reduce((sum, item) => {
      const unit = item.bultoPrice !== null ? safeNum(item.bultoPrice) : priceSell(item.product);
      return sum + unit * item.quantity;
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
      return {
        diffUsd: diff,
        diffBs: diff * safeNum(tasaBs, 1),
        isShort: diff < 0,
      };
    }
    const paid = safeNum(amountPaid);
    const diff = paid - totals.totalUsd;
    return {
      diffUsd: diff,
      diffBs: diff * safeNum(tasaBs, 1),
      isShort: diff < 0,
    };
  }, [paymentMethod, amountPaid, combinedUsd, combinedBs, totals.totalUsd, tasaBs]);

  const canProcess = useMemo(() => {
    if (cart.length === 0) return false;
    if (paymentMethod === 'movil' && !refNumber.trim()) return false;
    if (paymentMethod === 'combinado') {
      return !change.isShort;
    }
    if (paymentMethod !== 'deudores' && safeNum(amountPaid) < totals.totalUsd) return false;
    return true;
  }, [cart, paymentMethod, refNumber, amountPaid, totals.totalUsd, change.isShort]);

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
    cart.forEach((item) => {
      reduceStock(item.product.id, item.quantity);
    });
    setSaleComplete(true);
    setTimeout(resetSale, 2500);
  };

  const handleSendToDeudores = () => {
    if (!deudorName.trim() || cart.length === 0) return;
    cart.forEach((item) => {
      reduceStock(item.product.id, item.quantity);
    });
    setShowDeudorModal(false);
    setSaleComplete(true);
    setTimeout(resetSale, 2500);
  };

  const handleBultoApply = () => {
    if (bultoItem) {
      const basePrice = priceSell(bultoItem.product);
      const bultoPrice = basePrice * (1 - BULTO_DISCOUNT);
      setCart(cart.map((c) =>
        c.product.id === bultoItem.product.id
          ? { ...c, bultoPrice: bultoPrice }
          : c,
      ));
    }
    setBultoItem(null);
  };

  const handleBultoRemove = (id: string) => {
    setCart(cart.map((c) =>
      c.product.id === id ? { ...c, bultoPrice: null } : c,
    ));
  };

  const paymentOptions: { value: PaymentMethod; label: string; icon: typeof CreditCard }[] = [
    { value: 'divisas', label: 'Divisas', icon: DollarSign },
    { value: 'efectivo', label: 'Efectivo', icon: Banknote },
    { value: 'punto', label: 'Punto de Venta', icon: CreditCard },
    { value: 'movil', label: 'Pago Móvil', icon: Smartphone },
    { value: 'combinado', label: 'Pago Combinado', icon: Layers },
    { value: 'deudores', label: 'Deudores', icon: UsersIcon },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <ShoppingCart className="w-4 h-4 text-gold-500" />
        <span className="text-gold-500 font-medium">Módulo 2</span>
        <span>/</span>
        <span className="text-gray-600">Punto de Venta</span>
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
            className="w-full pr-4 py-4 text-lg border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
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
                          if (item.bultoPrice === null) {
                            setBultoItem(item);
                          } else {
                            handleBultoRemove(item.product.id);
                          }
                        }}
                        title={item.bultoPrice === null ? 'Doble clic para precio de bulto' : 'Doble clic para quitar bulto'}
                      >
                        {item.product.name}
                        {item.bultoPrice !== null && (
                          <span className="ml-2 text-xs bg-gold-100 text-gold-600 px-1.5 py-0.5 rounded-full font-semibold">
                            (Bulto)
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
                          className="w-16 text-center px-2 py-1.5 border border-gray-200 rounded text-sm bg-gray-50 hover:bg-gold-50 focus:outline-none focus:ring-1 focus:ring-gold-400 transition-colors"
                        />
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

        {/* Right panel: totals + payment */}
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

              {/* Payment method selector */}
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
                  />
                </div>
              )}

              {/* Pago Combinado */}
              {paymentMethod === 'combinado' && (
                <div className="space-y-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Entregado en Divisas ($)
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
                      Entregado en Efectivo (Bs)
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

              {/* Standard amount paid (not for deudores or combinado) */}
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

              {/* Deudores info */}
              {paymentMethod === 'deudores' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 mb-3 text-xs text-amber-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>La venta se enviará a Deudores. Se descuenta el inventario pero no se registran ganancias.</span>
                </div>
              )}

              {/* Action buttons */}
              {paymentMethod === 'deudores' ? (
                <button
                  onClick={() => {
                    if (cart.length > 0) setShowDeudorModal(true);
                  }}
                  disabled={cart.length === 0}
                  className={`w-full flex items-center justify-center gap-2 font-semibold py-3.5 rounded-lg transition-all text-base
                    ${cart.length > 0
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
              <h2 className="text-lg font-semibold text-gray-800 mb-1">¿Aplicar precio de Bulto?</h2>
              <p className="text-sm text-gray-500 mb-2">{bultoItem.product.name}</p>
              <div className="bg-gold-50 rounded-lg px-4 py-3 mb-6">
                <p className="text-xs text-gray-500 mb-1">Precio con 15% de descuento</p>
                <p className="text-2xl font-bold text-gold-600">
                  ${(priceSell(bultoItem.product) * (1 - BULTO_DISCOUNT)).toFixed(2)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Precio normal: ${priceSell(bultoItem.product).toFixed(2)}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setBultoItem(null)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  NO
                </button>
                <button
                  onClick={handleBultoApply}
                  className="flex-1 py-2.5 bg-gold-400 hover:bg-gold-500 text-white font-semibold rounded-lg transition-colors"
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
