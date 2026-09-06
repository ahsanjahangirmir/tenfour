import { Route, Routes } from "react-router-dom";
import HistoryDrawer from "./components/HistoryDrawer";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { HistoryDrawerProvider } from "./lib/HistoryDrawerContext";
import { useHistoryDrawer } from "./lib/historyDrawerStore";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import TripDetail from "./pages/TripDetail";

function Protected({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

function AppShell() {
  const { open, closeHistory } = useHistoryDrawer();

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sign-in/*" element={<SignInPage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />
        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/trips/:id" element={<Protected><TripDetail /></Protected>} />
      </Routes>
      <HistoryDrawer open={open} onClose={closeHistory} />
    </>
  );
}

export default function App() {
  return (
    <HistoryDrawerProvider>
      <AppShell />
    </HistoryDrawerProvider>
  );
}
