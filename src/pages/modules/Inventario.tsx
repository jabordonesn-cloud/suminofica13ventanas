import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Package,
  ScanLine,
  Plus,
  Trash2,
  X,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useStore } from '@/context/StoreContext';
import type { Product } from '@/types/product';

function safeNum(v: unknown, fallback = 0): number {
  if (v === null || v === undefined) return fallback;
  if (typeof v === 'number') return isNaN(v) ? fallback : v;
  const cleaned = String(v).replace(/[^0-9.,-]/g, '').replace(/,/g, '.');
  const n = parseFloat(cleaned);
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
    addManyProducts,
    updateProduct,
    deleteProduct,
  } = useStore();

  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [importCount, setImportCount] = useState(0);

  const [newBarcode, setNewBarcode] = useState('');
  const [newName, setNewName] = useState('');
  const [newStock, setNewStock] = useState('');
  const [newPriceBuy, setNewPriceBuy] = useState('');
  const [newGainPct, setNewGainPct] = useState('');

  const searchRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (importStatus === 'done') {
      const timer = setTimeout(() => setImportStatus('idle'), 3000);
      return () => clearTimeout(timer);
    }
  }, [importStatus]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!tableContainerRef.current) return;
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        tableContainerRef.current.scrollBy({ left: 60, behavior: 'smooth' });
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        tableContainerRef.current.scrollBy({ left: -60, behavior: 'smooth' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  /* ── LECTOR TRACTOR EXCEL (Fuerza Bruta) ── */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('loading');
    const reader = new FileReader();
    
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Extraemos absolutamente todo en una matriz gigante
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null }) as any[][];

        const nuevosProductos: Omit<Product, 'id'>[] = [];

        // Ignoramos las primeras 5 filas llenas de basura
        for (let i = 5; i < data.length; i++) {
          const row = data[i];
          if (!row || !Array.isArray(row)) continue;

          let name = '';
          const numbersInRow: number[] = [];

          // Revisamos celda por celda en la fila
          for (let j = 0; j < Math.min(row.length, 15); j++) {
            const val = row[j];
            if (val === null || val === undefined || val === '') continue;

            if (typeof val === 'number') {
              numbersInRow.push(val);
              continue;
            }

            const strVal = String(val).trim();
            if (!strVal) continue;

            // Intentar limpiar y convertir a número si es un precio camuflado
            const cleanedNum = strVal.replace(/[^0-9.,-]/g, '').replace(/,/g, '.');
            if (cleanedNum.length > 0 && !isNaN(parseFloat(cleanedNum))) {
              numbersInRow.push(parseFloat(cleanedNum));
              continue;
            }

            // Si llegamos aquí, es texto. Si tiene más de 3 letras y no es título, es el producto.
            if (!name && strVal.length > 3 && !strVal.toLowerCase().includes('existencia') && !strVal.toLowerCase().includes('costo') && !strVal.toLowerCase().includes('descripcion')) {
              name = strVal;
            }
          }

          if (!name) continue; // Si no hay producto, saltar fila

          // El primer número de la fila es el costo
          const cost = numbersInRow.length > 0 ? numbersInRow[0] : 0;
          
          // La existencia es difícil de pescar en Excels rotos, forzamos 0
          const stock = 0; 

          nuevosProductos.push({
            barcode: '',
            name,
            stock,
            priceBuy: cost,
            gainPct: 30 // Tu margen del 30% automático
          });
        }

        if (nuevosProductos.length === 0) {
          setImportStatus('error');
          return;
        }

        addManyProducts(nuevosProductos);
        setImportCount(nuevosProductos.length);
        setImportStatus('done');
      } catch (error) {
        console.error(error);
        setImportStatus('error');
      }
    };
    
    reader.onerror = () => setImportStatus('error');
    reader.readAsBinaryString(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    addProduct({
      barcode: newBarcode.trim(),
      name: newName.trim() || 'Producto sin nombre',
      stock: safeNum(newStock),
      priceBuy: safeNum(newPriceBuy),
      gainPct: safeNum(newGainPct) || 30,
    });
    setNewBarcode('');
    setNewName('');
    setNewStock('');
    setNewPriceBuy('');
    setNewGainPct('');
    setShowAdd(false);
    searchRef.current?.focus();
  };

  const calcRow = (p: Product) => {
    const buy = safeNum(p.priceBuy);
    const gain = safeNum(p.gainPct);
    const priceSell = buy + buy * (gain / 100);
    const priceBs = priceSell * safeNum(tasaBs, 1);
    const pricePts = priceBs / (safeNum(tasaPts, 1) || 1);
    return { priceSell, priceBs, pricePts };
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Package className="w-4 h-4 text-gold-500" />
        <span className="text-gold-500 font-medium">Módulo 1</span>
        <span>/</span>
        <span className="text-gray-600">Inventario</span>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 mb-4">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
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
              <label className="block text-xs font-medium text-gray-500 mb-1">Tasa $$</label>               <input                 type="number"                 step="0.01"                 value={tasaPts}                 onChange={(e) => setTasaPts(safeNum(e.target.value, tasaPts))}                 className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"               />             </div>           </div>            <div className="flex-1" />            <button             onClick={() => fileInputRef.current?.click()}             disabled={importStatus === 'loading'}             className="flex items-center gap-2 px-4 py-2 bg-gold-400 hover:bg-gold-500 text-white rounded-lg text-sm font-semibold transition-all shadow-gold-sm whitespace-nowrap disabled:opacity-50"           >             {importStatus === 'loading' ? (               <Loader2 className="w-4 h-4 animate-spin" />             ) : (               <FileSpreadsheet className="w-4 h-4" />             )}             Cargar Inventario (Excel/CSV)           </button>           <button             onClick={() => setShowAdd(true)}             className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-all shadow-sm whitespace-nowrap"           >             <Plus className="w-4 h-4" />             Agregar Producto           </button>           <input             ref={fileInputRef}             type="file"             accept=".xlsx, .xls, .csv"             onChange={handleFileChange}             className="hidden"           />         </div>          {importStatus === 'done' && (           <div className="mt-3 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-4 py-2.5">             <CheckCircle2 className="w-4 h-4" />             Se importaron <strong>{importCount}</strong> productos correctamente.           </div>         )}         {importStatus === 'error' && (           <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2.5">             <AlertTriangle className="w-4 h-4" />             No se pudieron leer los datos. Verifique que el archivo Excel sea el correcto.           </div>         )}          <div className="mt-3 relative">           <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gold-400" />           <input             ref={searchRef}             type="text"             value={search}             onChange={(e) => setSearch(e.target.value)}             onKeyDown={handleQuickAdd}             placeholder="Escanear Código de Barras / Buscar producto..."             className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"             autoFocus           />           <div className="mt-2 flex items-center gap-2">             <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-full px-3 py-1">               <Package className="w-3.5 h-3.5 text-gold-500" />               Total en inventario: <strong className="text-gray-700">{products.length}</strong> productos             </span>           </div>         </div>       </div>        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">         <div className="h-1.5 bg-gradient-to-r from-gold-300 via-gold-400 to-gold-500" />         <div ref={tableContainerRef} className="overflow-x-auto">           <table className="w-full text-sm">             <thead>               <tr className="bg-gold-50 text-gray-600 text-xs uppercase tracking-wider">                 <th className="text-center px-4 py-3 font-semibold w-12">Nº</th>                 <th className="text-left px-4 py-3 font-semibold">Código de Barras</th>                 <th className="text-left px-4 py-3 font-semibold min-w-[350px]">Nombre del Producto</th>                 <th className="text-center px-4 py-3 font-semibold">Existencia</th>                 <th className="text-right px-4 py-3 font-semibold">Precio Compra</th>                 <th className="text-center px-4 py-3 font-semibold">\% Ganancia</th>                 <th className="text-right px-4 py-3 font-semibold">Precio Venta</th>                 <th className="text-right px-4 py-3 font-semibold text-blue-600">Precio en Bs</th>                 <th className="text-right px-4 py-3 font-semibold text-green-700">Precio en $$</th>
                <th className="text-center px-4 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {sortedProducts.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-gray-400">
                    No hay productos. Use el escáner o cargue un archivo Excel/CSV para comenzar.
                  </td>
                </tr>
              )}
              {sortedProducts.map((p, index) => {
                const { priceSell, priceBs, pricePts } = calcRow(p);
                const isLowStock = p.stock <= 5;

                return (
                  <tr
                    key={p.id}
                    className={`border-t border-gray-50 transition-colors ${isLowStock ? 'bg-red-50' : 'hover:bg-gray-50/50'}`}
                  >
                    <td className="px-4 py-3 text-center text-gray-500 font-medium">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {isLowStock && (
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                        )}
                        <input
                          type="text"
                          value={p.barcode}
                          onChange={(e) => updateProduct(p.id, { barcode: e.target.value })}
                          className="w-32 font-mono text-xs px-2 py-1 border border-gray-200 rounded bg-gray-50 hover:bg-gold-50 focus:outline-none focus:ring-1 focus:ring-gold-400 focus:border-transparent transition-colors"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => updateProduct(p.id, { name: e.target.value })}
                        className="w-full min-w-[330px] font-medium text-gray-700 px-2 py-1 border border-gray-200 rounded bg-gray-50 hover:bg-gold-50 focus:outline-none focus:ring-1 focus:ring-gold-400 focus:border-transparent transition-colors"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        value={p.stock}
                        onChange={(e) => updateProduct(p.id, { stock: safeNum(e.target.value) })}
                        className={`w-16 text-center px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-gold-400 transition-colors
                          ${isLowStock
                            ? 'border-red-300 text-red-600 font-bold bg-red-50'
                            : 'border-gray-200 bg-gray-50 hover:bg-gold-50 text-gray-700'}`}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={p.priceBuy}
                        onChange={(e) => updateProduct(p.id, { priceBuy: safeNum(e.target.value) })}
                        className="w-20 text-right px-2 py-1 border border-gray-200 rounded text-sm bg-gray-50 hover:bg-gold-50 focus:outline-none focus:ring-1 focus:ring-gold-400 focus:border-transparent transition-colors"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        step="0.01"
                        value={p.gainPct}
                        onChange={(e) => updateProduct(p.id, { gainPct: safeNum(e.target.value) })}
                        className="w-16 text-center px-2 py-1 border border-gray-200 rounded text-sm bg-gray-50 hover:bg-gold-50 focus:outline-none focus:ring-1 focus:ring-gold-400 focus:border-transparent transition-colors"
                      />
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">
                      ${priceSell.toFixed(2)}                     </td>                     <td className="px-4 py-3 text-right font-semibold text-blue-600">                       Bs {priceBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}                     </td>                     <td className="px-4 py-3 text-right font-semibold text-green-700">                       $$ {pricePts.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                  placeholder="Dejar en blanco para usar lector USB después"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nombre del Producto</label>
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
                    placeholder="30"
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