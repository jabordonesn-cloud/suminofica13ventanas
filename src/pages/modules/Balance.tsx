import ModulePlaceholder from '@/components/ModulePlaceholder';
import { Scale } from 'lucide-react';

export default function Balance() {
  return (
    <ModulePlaceholder
      title="Balance"
      description="Flujo de ingresos y egresos manuales."
      icon={Scale}
      moduleNumber={13}
      adminOnly
    />
  );
}
