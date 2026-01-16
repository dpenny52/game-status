# Bug Fixes

Bugs discovered during E2E testing with Playwright MCP (January 16, 2026).

## Bug 1: Missing AuthProvider in App.tsx

**File:** `/src/App.tsx`

**Problem:** The `Dashboard` component uses the `useAuth()` hook which requires an `AuthProvider` context wrapper. Without it, the hook fails when trying to access authentication state.

**Fix:** Add `AuthProvider` wrapper around the Dashboard component in App.tsx.

**Status:** Fixed during E2E testing

---

## Bug 2: Convex Client Requirement in Demo Mode

**File:** `/src/pages/Dashboard/Dashboard.tsx`

**Problem:** The Dashboard component used `useQuery` from Convex which fails when no Convex backend is configured. This prevented the app from working in demo/development mode without a live backend.

**Fix:** Added demo data support and `useConvex` prop to Dashboard component so it can display sample game data when running without a Convex backend connection.

**Status:** Fixed during E2E testing

---

## Summary

| Bug | File | Status |
|-----|------|--------|
| Missing AuthProvider | `/src/App.tsx` | Fixed |
| Convex Client Requirement in Demo Mode | `/src/pages/Dashboard/Dashboard.tsx` | Fixed |
