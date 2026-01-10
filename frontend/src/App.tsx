import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LoginPage } from './pages/auth/Login';
import { SignupPage } from './pages/auth/Signup';
import { DashboardPage } from './pages/Dashboard';
import { WeddingSetupPage } from './pages/wedding/Setup';
import { FunctionsPage } from './pages/wedding/Functions';
import { GuestsPage } from './pages/wedding/Guests';
import { BudgetPage } from './pages/wedding/Budget';
import { MediaPage } from './pages/wedding/Media';
import { ChatPage } from './pages/wedding/Chat';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wedding/create"
          element={
            <ProtectedRoute>
              <WeddingSetupPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wedding/setup"
          element={
            <ProtectedRoute>
              <WeddingSetupPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wedding/functions"
          element={
            <ProtectedRoute>
              <FunctionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wedding/guests"
          element={
            <ProtectedRoute>
              <GuestsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wedding/budget"
          element={
            <ProtectedRoute>
              <BudgetPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wedding/media"
          element={
            <ProtectedRoute>
              <MediaPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wedding/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />

        {/* Default Route */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
