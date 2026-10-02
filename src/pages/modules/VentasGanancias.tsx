import ModulePlaceholder from '@/components/ModulePlaceholder';
import { TrendingUp } from 'lucide-react';

export default function VentasGanancias() {
  return (
    <ModulePlaceholder
      title="Ventas y Ganancias"
      description="Reportes diarios, cálculo de utilidad y exportación a ticket/PDF."
      icon={TrendingUp}
      moduleNumber={4}
    />
  );
}
