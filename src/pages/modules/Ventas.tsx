import ModulePlaceholder from '@/components/ModulePlaceholder';
import { ShoppingCart } from 'lucide-react';

export default function Ventas() {
  return (
    <ModulePlaceholder
      title="Ventas"
      description="Facturación multi-moneda $, Bs, $$ y conexión con inventario."
      icon={ShoppingCart}
      moduleNumber={2}
    />
  );
}
