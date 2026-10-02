import ModulePlaceholder from '@/components/ModulePlaceholder';
import { CreditCard } from 'lucide-react';

export default function Pagos() {
  return (
    <ModulePlaceholder
      title="Pagos"
      description="Calendario de nómina semafórico."
      icon={CreditCard}
      moduleNumber={9}
      adminOnly
    />
  );
}
