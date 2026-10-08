import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Product } from '@/types/product';

interface StoreContextValue {
  tasaBs: number;
  tasaPts: number;
  setTasaBs: (v: number) => void;
  setTasaPts: (v: number) => void;

  products: Product[];
  addProduct: (p: Omit<Product, 'id'>) => void;
  addManyProducts: (items: Omit<Product, 'id'>[]) => void;
  updateProduct: (id: string, updates: Partial<Omit<Product, 'id'>>) => void;
  deleteProduct: (id: string) => void;
  reduceStock: (id: string, qty: number) => void;
  findByBarcodeOrName: (query: string) => Product | undefined;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

const seedProducts: Product[] = [
  { id: 'p1', barcode: '7591234567890', name: 'Cuaderno Universitario', stock: 24, priceBuy: 1.5, gainPct: 40 },
  { id: 'p2', barcode: '7591234567891', name: 'Lápiz HB #2', stock: 3, priceBuy: 0.25, gainPct: 60 },
  { id: 'p3', barcode: '7591234567892', name: 'Caja de Lápices de Colores', stock: 15, priceBuy: 3.0, gainPct: 35 },
  { id: 'p4', barcode: '7591234567893', name: 'Resma de Papel A4', stock: 2, priceBuy: 5.0, gainPct: 30 },
  { id: 'p5', barcode: '7591234567894', name: 'Borrador de Lápiz', stock: 50, priceBuy: 0.15, gainPct: 50 },
  { id: 'p6', barcode: '7591234567895', name: 'Tijera Escolar', stock: 8, priceBuy: 1.2, gainPct: 45 },
];

function loadProducts(): Product[] {
  const raw = localStorage.getItem('erp_products');
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fall through
    }
  }
  localStorage.setItem('erp_products', JSON.stringify(seedProducts));
  return seedProducts;
}

function loadRate(key: string, fallback: number): number {
  const raw = localStorage.getItem(key);
  if (raw) {
    const n = parseFloat(raw);
    if (!isNaN(n)) return n;
  }
  localStorage.setItem(key, String(fallback));
  return fallback;
}

function genId(): string {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [tasaBs, setTasaBsState] = useState(() => loadRate('erp_tasa_bs', 150));
  const [tasaPts, setTasaPtsState] = useState(() => loadRate('erp_tasa_pts', 2.5));
  const [products, setProducts] = useState<Product[]>(() => loadProducts());

  const persistProducts = (next: Product[]) => {
    setProducts(next);
    localStorage.setItem('erp_products', JSON.stringify(next));
  };

  const setTasaBs = (v: number) => {
    setTasaBsState(v);
    localStorage.setItem('erp_tasa_bs', String(v));
  };

  const setTasaPts = (v: number) => {
    setTasaPtsState(v);
    localStorage.setItem('erp_tasa_pts', String(v));
  };

  const addProduct = (p: Omit<Product, 'id'>) => {
    persistProducts([...products, { ...p, id: genId() }]);
  };

  const addManyProducts = (items: Omit<Product, 'id'>[]) => {
    const mapped = items.map((item) => ({ ...item, id: genId() }));
    persistProducts([...products, ...mapped]);
  };

  const updateProduct = (id: string, updates: Partial<Omit<Product, 'id'>>) => {
    persistProducts(products.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deleteProduct = (id: string) => {
    persistProducts(products.filter((p) => p.id !== id));
  };

  const reduceStock = (id: string, qty: number) => {
    persistProducts(
      products.map((p) =>
        p.id === id ? { ...p, stock: Math.max(0, p.stock - qty) } : p,
      ),
    );
  };

  const findByBarcodeOrName = (query: string): Product | undefined => {
    const q = query.trim().toLowerCase();
    if (!q) return undefined;
    return products.find(
      (p) => p.barcode.toLowerCase() === q || p.name.toLowerCase().includes(q),
    );
  };

  return (
    <StoreContext.Provider
      value={{
        tasaBs,
        tasaPts,
        setTasaBs,
        setTasaPts,
        products,
        addProduct,
        addManyProducts,
        updateProduct,
        deleteProduct,
        reduceStock,
        findByBarcodeOrName,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used within StoreProvider');
  }
  return ctx;
}
