import ModulePlaceholder from '@/components/ModulePlaceholder';
import { Users } from 'lucide-react';

export default function Deudores() {
  return (
    <ModulePlaceholder
      title="Deudores"
      description="Carpetas de clientes fiados y control de abonos."
      icon={Users}
      moduleNumber={3}
    />
  );
}
