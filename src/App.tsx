import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './layouts/Layout';
import { Dashboard } from './pages/Dashboard';
import { NewOrder } from './pages/NewOrder';
import { Orders } from './pages/Orders';
import { OrderDetails } from './pages/OrderDetails';
import { ResolveOrder } from './pages/ResolveOrder';
import { ResolveList } from './pages/ResolveList';
import { Ranking } from './pages/Ranking';
import { Profile } from './pages/Profile';
import { Login } from './pages/Login';
import { ResetPassword } from './pages/ResetPassword';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { OrdersProvider } from './contexts/OrdersContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { NotificationToast } from './components/NotificationToast';

import { UserManagement } from './pages/UserManagement';
import { ChecklistList } from './pages/checklists/ChecklistList';
import { ChecklistExecution } from './pages/checklists/ChecklistExecution';
import { ChecklistBuilder } from './pages/checklists/ChecklistBuilder';
import { ChecklistHistory } from './pages/checklists/ChecklistHistory';
import { DailyRoutine } from './pages/DailyRoutine';

// Módulo TI
import { TiChamadosList } from './pages/ti/TiChamadosList';
import { TiNovoChamado } from './pages/ti/TiNovoChamado';
import { TiChamadoDetails } from './pages/ti/TiChamadoDetails';
import { TiRelatorios } from './pages/ti/TiRelatorios';
function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <NotificationToast />
        <OrdersProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/new-order" element={<NewOrder />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/orders/:id" element={<OrderDetails />} />
                  <Route path="/orders/:id/resolve" element={<ResolveOrder />} />
                  <Route path="/resolve" element={<ResolveList />} />
                  <Route path="/ranking" element={<Ranking />} />
                  <Route path="/users" element={<UserManagement />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/daily" element={<DailyRoutine />} />
                  <Route path="/checklists" element={<ChecklistList />} />
                  <Route path="/checklists/create" element={<ChecklistBuilder />} />
                  <Route path="/checklists/history" element={<ChecklistHistory />} />
                  <Route path="/checklists/edit/:id" element={<ChecklistBuilder />} />
                  <Route path="/checklists/new" element={<ChecklistExecution />} />
                  <Route path="/checklists/:id" element={<ChecklistExecution />} />
                  
                  {/* Rotas TI */}
                  <Route path="/ti/chamados" element={<TiChamadosList />} />
                  <Route path="/ti/novo" element={<TiNovoChamado />} />
                  <Route path="/ti/chamados/:id" element={<TiChamadoDetails />} />
                  <Route path="/ti/relatorios" element={<TiRelatorios />} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </OrdersProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
