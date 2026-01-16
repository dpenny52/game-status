/**
 * App Component
 *
 * Root application component that sets up the Convex provider,
 * Toast notifications, and renders the Dashboard.
 */
import React from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
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
      <ToastProvider>
        <div className="app">
          <Dashboard />
        </div>
      </ToastProvider>
    );
  }

  return (
    <ConvexProvider client={convex}>
      <ToastProvider>
        <div className="app">
          <Dashboard />
        </div>
      </ToastProvider>
    </ConvexProvider>
  );
}

export default App;
