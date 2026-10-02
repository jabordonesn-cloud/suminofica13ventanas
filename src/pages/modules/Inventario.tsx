import ModulePlaceholder from '@/components/ModulePlaceholder';
import { Package } from 'lucide-react';

export default function Inventario() {
  return (
    <ModulePlaceholder
      title="Inventario"
      description="Tabla de productos, lectura de código de barras y cuadros multiplicadores Bs y $."
      icon={Package}
      moduleNumber={1}
    />
  );
}
