export interface Product {
  id: string;
  barcode: string;
  name: string;
  stock: number;
  priceBuy: number;
  gainPct: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  bultoPrice: number | null;
}

export type PaymentMethod = 'divisas' | 'efectivo' | 'punto' | 'movil' | 'deudores';
