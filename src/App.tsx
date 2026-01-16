/**
 * App Component
 *
 * Root application component that sets up the Convex provider,
 * Auth provider, Toast notifications, routing, and renders pages.
 */
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { AuthModals } from "./components/auth";
import { Dashboard } from "./pages/Dashboard";
import { ResetPassword } from "./pages/ResetPassword";
import { Settings } from "./pages/Settings";
import { VerifyMagicLink } from "./pages/VerifyMagicLink";
import "./App.css";

// Initialize Convex client
const convexUrl = import.meta.env.VITE_CONVEX_URL || "";
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

/**
 * App is the root component of the application.
 */
export function App(): JSX.Element {
  // If Convex URL is not configured, show demo mode
  if (!convex) {
    return (
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <div className="app">
              <AuthModals />
              <Routes>
                <Route path="/" element={<Dashboard useConvex={false} />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/verify-magic-link" element={<VerifyMagicLink />} />
              </Routes>
            </div>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <ConvexProvider client={convex}>
        <AuthProvider>
          <ToastProvider>
            <div className="app">
              <AuthModals />
              <Routes>
                <Route path="/" element={<Dashboard useConvex={true} />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/verify-magic-link" element={<VerifyMagicLink />} />
              </Routes>
            </div>
          </ToastProvider>
        </AuthProvider>
      </ConvexProvider>
    </BrowserRouter>
  );
}

export default App;
