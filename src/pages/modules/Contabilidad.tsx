import ModulePlaceholder from '@/components/ModulePlaceholder';
import { Calculator } from 'lucide-react';

export default function Contabilidad() {
  return (
    <ModulePlaceholder
      title="Contabilidad"
      description="Aloja 20 submódulos VEN-NIF como Libro Mayor, IVA, IGTF, etc."
      icon={Calculator}
      moduleNumber={8}
      adminOnly
    />
  );
}
