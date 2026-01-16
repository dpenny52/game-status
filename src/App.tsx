/**
 * App Component
 *
 * Root application component that sets up the Convex provider,
 * Auth provider, Toast notifications, and renders the Dashboard.
 */
import React from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { Dashboard } from "./pages/Dashboard";
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
      <AuthProvider>
        <ToastProvider>
          <div className="app">
            <Dashboard useConvex={false} />
          </div>
        </ToastProvider>
      </AuthProvider>
    );
  }

  return (
    <ConvexProvider client={convex}>
      <AuthProvider>
        <ToastProvider>
          <div className="app">
            <Dashboard useConvex={true} />
          </div>
        </ToastProvider>
      </AuthProvider>
    </ConvexProvider>
  );
}

export default App;
