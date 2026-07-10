import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import OfflineIndicator from "@/components/common/OfflineIndicator";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { lazy, Suspense } from "react";

const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Auth = lazy(() => import("./pages/Auth"));
const Manager = lazy(() => import("./pages/Manager"));
const Payments = lazy(() => import("./pages/Payments"));
const DpoReturn = lazy(() => import("./pages/DpoReturn"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner />
  </div>
);

const wrap = (node: React.ReactNode) => (
  <ErrorBoundary>
    <Suspense fallback={<RouteFallback />}>{node}</Suspense>
  </ErrorBoundary>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <OfflineIndicator />
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route path="/" element={wrap(<Index />)} />
              <Route path="/auth" element={wrap(<Auth />)} />
              <Route path="/manager" element={wrap(<Manager />)} />
              <Route path="/payments" element={wrap(<Payments />)} />
              <Route path="/payments/dpo-return" element={wrap(<DpoReturn />)} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={wrap(<NotFound />)} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
