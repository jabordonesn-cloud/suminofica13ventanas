import ModulePlaceholder from '@/components/ModulePlaceholder';
import { Wallet } from 'lucide-react';

export default function Deuda() {
  return (
    <ModulePlaceholder
      title="Deuda"
      description="Control de cuentas por pagar a entidades."
      icon={Wallet}
      moduleNumber={10}
      adminOnly
    />
  );
}
