import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { StoreProvider } from '@/context/StoreContext';
import Login from '@/pages/Login';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Inventario from '@/pages/modules/Inventario';
import Ventas from '@/pages/modules/Ventas';
import Deudores from '@/pages/modules/Deudores';
import VentasGanancias from '@/pages/modules/VentasGanancias';
import Tendencias from '@/pages/modules/Tendencias';
import Proveedores from '@/pages/modules/Proveedores';
import Clientes from '@/pages/modules/Clientes';
import Contabilidad from '@/pages/modules/Contabilidad';
import Pagos from '@/pages/modules/Pagos';
import Deuda from '@/pages/modules/Deuda';
import ListasEscolares from '@/pages/modules/ListasEscolares';
import CotizacionListas from '@/pages/modules/CotizacionListas';
import Balance from '@/pages/modules/Balance';

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/inventario" element={<Inventario />} />
              <Route path="/ventas" element={<Ventas />} />
              <Route path="/deudores" element={<Deudores />} />
              <Route path="/ventas-ganancias" element={<VentasGanancias />} />
              <Route path="/tendencias" element={<Tendencias />} />
              <Route path="/proveedores" element={<Proveedores />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route
                path="/contabilidad"
                element={
                  <ProtectedRoute adminOnly>
                    <Contabilidad />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pagos"
                element={
                  <ProtectedRoute adminOnly>
                    <Pagos />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/deuda"
                element={
                  <ProtectedRoute adminOnly>
                    <Deuda />
                  </ProtectedRoute>
                }
              />
              <Route path="/listas-escolares" element={<ListasEscolares />} />
              <Route path="/cotizacion-listas" element={<CotizacionListas />} />
              <Route
                path="/balance"
                element={
                  <ProtectedRoute adminOnly>
                    <Balance />
                  </ProtectedRoute>
                }
              />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </StoreProvider>
    </AuthProvider>
  );
}
