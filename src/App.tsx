/**
 * App Component
 *
 * Root application component that sets up the Convex provider
 * and renders the Dashboard.
 */
import React from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
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
      <div className="app">
        <Dashboard />
      </div>
    );
  }

  return (
    <ConvexProvider client={convex}>
      <div className="app">
        <Dashboard />
      </div>
    </ConvexProvider>
  );
}

export default App;
