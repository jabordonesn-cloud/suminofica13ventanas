import type { LucideIcon } from 'lucide-react';

interface PlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  moduleNumber: number;
  adminOnly?: boolean;
}

export default function ModulePlaceholder({
  title,
  description,
  icon: Icon,
  moduleNumber,
  adminOnly = false,
}: PlaceholderProps) {
  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <span className="text-gold-500 font-medium">Módulo {moduleNumber}</span>
        <span>/</span>
        <span className="text-gray-600">{title}</span>
      </div>

      {/* Header card */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-gold-300 via-gold-400 to-gold-500" />
        <div className="p-8">
          <div className="flex items-start gap-5">
            <div className="flex-shrink-0 w-16 h-16 bg-gold-50 border border-gold-200 rounded-xl flex items-center justify-center">
              <Icon className="w-8 h-8 text-gold-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
                {adminOnly && (
                  <span className="text-xs bg-gold-100 text-gold-500 px-2 py-1 rounded-full font-medium">
                    Solo Administrador
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Placeholder content area */}
      <div className="mt-6 bg-white border border-dashed border-gray-200 rounded-2xl p-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gold-50 rounded-full mb-4">
            <Icon className="w-7 h-7 text-gold-300" />
          </div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Módulo en preparación</h2>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            Este módulo está listo para ser desarrollado en las siguientes fases del proyecto.
            La estructura base y el enrutamiento ya se encuentran configurados.
          </p>
        </div>
      </div>
    </div>
  );
}
