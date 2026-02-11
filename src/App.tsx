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
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { OrdersProvider } from './contexts/OrdersContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { NotificationToast } from './components/NotificationToast';

import { UserManagement } from './pages/UserManagement';
import { ChecklistList } from './pages/checklists/ChecklistList';
import { ChecklistExecution } from './pages/checklists/ChecklistExecution';
import { ChecklistBuilder } from './pages/checklists/ChecklistBuilder';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <NotificationToast />
        <OrdersProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              
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
                  <Route path="/checklists" element={<ChecklistList />} />
                  <Route path="/checklists/create" element={<ChecklistBuilder />} />
                  <Route path="/checklists/new" element={<ChecklistExecution />} />
                  <Route path="/checklists/:id" element={<ChecklistExecution />} />
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
