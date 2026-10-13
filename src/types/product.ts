export interface Product {
  id: string;
  barcode: string;
  name: string;
  stock: number;
  priceBuy: number;
  gainPct: number;
  precioMayor?: number;
  precioBulto?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  isBulto: boolean;
}

export type PaymentMethod = 'divisas' | 'efectivo' | 'punto' | 'movil' | 'combinado' | 'deudores';
