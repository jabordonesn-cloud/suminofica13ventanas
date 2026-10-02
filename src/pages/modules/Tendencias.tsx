import ModulePlaceholder from '@/components/ModulePlaceholder';
import { BarChart3 } from 'lucide-react';

export default function Tendencias() {
  return (
    <ModulePlaceholder
      title="Tendencias"
      description="Ranking acumulativo de productos más vendidos."
      icon={BarChart3}
      moduleNumber={5}
    />
  );
}
