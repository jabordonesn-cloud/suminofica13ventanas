import ModulePlaceholder from '@/components/ModulePlaceholder';
import { Truck } from 'lucide-react';

export default function Proveedores() {
  return (
    <ModulePlaceholder
      title="Proveedores"
      description="Carpetas de proveedores y tabla comparativa de costos."
      icon={Truck}
      moduleNumber={6}
    />
  );
}
