import { useState, useMemo, useRef } from 'react';
import {
  Package,
  Upload,
  ScanLine,
  Plus,
  Trash2,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import type { Product } from '@/types/product';

function safeNum(v: string | number, fallback = 0): number {
  const n = typeof v === 'number' ? v : parseFloat(v);
  return isNaN(n) ? fallback : n;
}

export default function Inventario() {
  const {
    tasaBs,
    tasaPts,
    setTasaBs,
    setTasaPts,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
  } = useStore();

  const [search, setSearch] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  // New product form state
  const [newBarcode, setNewBarcode] = useState('');
  const [newName, setNewName] = useState('');
  const [newStock, setNewStock] = useState('');
  const [newPriceBuy, setNewPriceBuy] = useState('');
  const [newGainPct, setNewGainPct] = useState('');

  const searchRef = useRef<HTMLInputElement>(null);

  // Sort: low stock (<=5) first, then by name
  const sortedProducts = useMemo(() => {
    const filtered = products.filter((p) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return p.barcode.toLowerCase().includes(q) || p.name.toLowerCase().includes(q);
    });
    return [...filtered].sort((a, b) => {
      const aLow = a.stock <= 5 ? 0 : 1;
      const bLow = b.stock <= 5 ? 0 : 1;
      if (aLow !== bLow) return aLow - bLow;
      return a.name.localeCompare(b.name);
    });
  }, [products, search]);

  const handleQuickAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const q = search.trim();
    if (!q) return;
    const existing = products.find(
      (p) => p.barcode.toLowerCase() === q.toLowerCase() || p.name.toLowerCase() === q.toLowerCase(),
    );
    if (existing) {
      updateProduct(existing.id, { stock: existing.stock + 1 });
      setSearch('');
      return;
    }
    setNewBarcode(q);
    setShowAdd(true);
    setSearch('');
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    addProduct({
      barcode: newBarcode.trim() || `GEN${Date.now()}`,
      name: newName.trim() || 'Producto sin nombre',
      stock: safeNum(newStock),
      priceBuy: safeNum(newPriceBuy),
      gainPct: safeNum(newGainPct),
    });
    setNewBarcode('');
    setNewName('');
    setNewStock('');
    setNewPriceBuy('');
    setNewGainPct('');
    setShowAdd(false);
    searchRef.current?.focus();
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Package className="w-4 h-4 text-gold-500" />
        <span className="text-gold-500 font-medium">Módulo 1</span>
        <span>/</span>
        <span className="text-gray-600">Inventario</span>
      </div>

      {/* Top controls: rates + import + scanner */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 mb-4">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
          {/* Rates */}
          <div className="flex gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tasa Bs</label>
              <input
                type="number"
                step="0.01"
                value={tasaBs}
                onChange={(e) => setTasaBs(safeNum(e.target.value, tasaBs))}
                className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tasa $$</label>
              <input
                type="number"
                step="0.01"
                value={tasaPts}
                onChange={(e) => setTasaPts(safeNum(e.target.value, tasaPts))}
                className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex-1" />

          {/* Import button */}
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gold-300 text-gold-500 rounded-lg text-sm font-medium hover:bg-gold-50 transition-colors whitespace-nowrap"
          >
            <Upload className="w-4 h-4" />
            Importar Excel/PDF
          </button>
        </div>

        {/* Scanner / Search */}
        <div className="mt-3 relative">
          <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gold-400" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleQuickAdd}
            placeholder="Escanear Código de Barras / Buscar producto..."
            className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
            autoFocus
          />
        </div>
      </div>

      {/* Products table */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-gold-300 via-gold-400 to-gold-500" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gold-50 text-gray-600 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-semibold">Código de Barras</th>
                <th className="text-left px-4 py-3 font-semibold">Nombre</th>
                <th className="text-center px-4 py-3 font-semibold">Existencia</th>
                <th className="text-right px-4 py-3 font-semibold">Precio Compra</th>
                <th className="text-center px-4 py-3 font-semibold">% Ganancia</th>
                <th className="text-right px-4 py-3 font-semibold">Precio Venta</th>
                <th className="text-right px-4 py-3 font-semibold text-gold-500">Precio en Bs</th>
                <th className="text-right px-4 py-3 font-semibold text-emerald-600">Precio $$</th>
                <th className="text-center px-4 py-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sortedProducts.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-400">
                    No hay productos. Use el escáner para agregar productos rápidamente.
                  </td>
                </tr>
              )}
              {sortedProducts.map((p) => {
                const priceBuy = safeNum(p.priceBuy);
                const gainPct = safeNum(p.gainPct);
                const priceSell = priceBuy + priceBuy * (gainPct / 100);
                const priceBs = priceSell * safeNum(tasaBs, 1);
                const pricePts = priceBs * safeNum(tasaPts, 1);
                const isLowStock = p.stock <= 5;

                return (
                  <tr
                    key={p.id}
                    className={`border-t border-gray-50 transition-colors ${isLowStock ? 'bg-red-50' : 'hover:bg-gray-50/50'}`}
                  >
                    <td className="px-4 py-3">
                      {isLowStock && (
                        <AlertTriangle className="inline w-3.5 h-3.5 text-red-400 mr-1.5" />
                      )}
                      <span className="font-mono text-xs text-gray-600">{p.barcode}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-700">{p.name}</td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        value={p.stock}
                        onChange={(e) => updateProduct(p.id, { stock: safeNum(e.target.value) })}
                        className={`w-16 text-center px-1 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-gold-400
                          ${isLowStock ? 'border-red-300 text-red-600 font-semibold bg-red-50' : 'border-gray-200'}`}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={p.priceBuy}
                        onChange={(e) => updateProduct(p.id, { priceBuy: safeNum(e.target.value) })}
                        className="w-20 text-right px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gold-400"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        step="0.01"
                        value={p.gainPct}
                        onChange={(e) => updateProduct(p.id, { gainPct: safeNum(e.target.value) })}
                        className="w-16 text-center px-1 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gold-400"
                      />
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">
                      ${priceSell.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gold-500">
                      Bs {priceBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                      $$ {pricePts.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => deleteProduct(p.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Eliminar"
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

      {/* Import dialog (simulated) */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
            <button
              onClick={() => setShowImport(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gold-400 rounded-lg flex items-center justify-center">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Importar Excel/PDF</h2>
            </div>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
              <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                Arrastre su archivo aquí o haga clic para seleccionar
              </p>
              <p className="text-xs text-gray-400 mt-1">Formatos soportados: .xlsx, .csv, .pdf</p>
            </div>
            <button
              onClick={() => setShowImport(false)}
              className="mt-6 w-full bg-gold-400 hover:bg-gold-500 text-white font-semibold py-2.5 rounded-lg transition-all"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Add product dialog */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
            <button
              onClick={() => {
                setShowAdd(false);
                setNewBarcode('');
                setNewName('');
                setNewStock('');
                setNewPriceBuy('');
                setNewGainPct('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gold-400 rounded-lg flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Agregar Producto</h2>
            </div>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Código de Barras</label>
                <input
                  type="text"
                  value={newBarcode}
                  onChange={(e) => setNewBarcode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nombre</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Existencia</label>
                  <input
                    type="number"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Precio Compra</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPriceBuy}
                    onChange={(e) => setNewPriceBuy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">% Ganancia</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newGainPct}
                    onChange={(e) => setNewGainPct(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-gold-400 hover:bg-gold-500 text-white font-semibold py-2.5 rounded-lg transition-all"
              >
                Guardar Producto
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
