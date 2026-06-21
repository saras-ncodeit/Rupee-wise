import { Routes, Route, Navigate } from 'react-router-dom';
import NavigationShell from './components/NavigationShell';
import LoginView from './views/LoginView';
import RegisterView from './views/RegisterView';
import DashboardView from './views/DashboardView';
import TransactionsView from './views/TransactionsView';
import BudgetsView from './views/BudgetsView';
import SettingsView from './views/SettingsView';
import ReportsView from './views/ReportsView';
import CategoriesView from './views/CategoriesView';

export default function App() {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<LoginView />} />
      <Route path="/register" element={<RegisterView />} />

      {/* Protected App Routes wrapped in Navigation Layout */}
      <Route
        path="/"
        element={
          <NavigationShell>
            <DashboardView />
          </NavigationShell>
        }
      />
      <Route
        path="/transactions"
        element={
          <NavigationShell>
            <TransactionsView />
          </NavigationShell>
        }
      />
      <Route
        path="/budgets"
        element={
          <NavigationShell>
            <BudgetsView />
          </NavigationShell>
        }
      />
      <Route
        path="/settings"
        element={
          <NavigationShell>
            <SettingsView />
          </NavigationShell>
        }
      />
      <Route
        path="/categories"
        element={
          <NavigationShell>
            <CategoriesView />
          </NavigationShell>
        }
      />
      <Route
        path="/reports"
        element={
          <NavigationShell>
            <ReportsView />
          </NavigationShell>
        }
      />

      {/* Wildcard Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
