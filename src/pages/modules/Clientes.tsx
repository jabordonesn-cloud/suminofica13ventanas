import ModulePlaceholder from '@/components/ModulePlaceholder';
import { UserCircle } from 'lucide-react';

export default function Clientes() {
  return (
    <ModulePlaceholder
      title="Clientes"
      description="Cotizador formal interactivo."
      icon={UserCircle}
      moduleNumber={7}
    />
  );
}
