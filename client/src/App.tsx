import React from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import { ThemeProvider } from "./contexts/ThemeContext";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import Home from "./pages/Home";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import SetPassword from "./pages/SetPassword";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import QuoteRequest from "./pages/QuoteRequest";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import AboutUs from "./pages/AboutUs";
import TermsConditions from "./pages/TermsConditions";
import FAQ from "./pages/FAQ";
import NotFound from "./pages/NotFound";
import BookingIntakeForm from "./pages/BookingIntakeForm";
import ReferralLanding from "./pages/ReferralLanding";
import LoyaltyDashboard from "./pages/LoyaltyDashboard";
import AdminLoyalty from "./pages/AdminLoyalty";
import FlightManager from "./pages/FlightManager";
import QuotePage from "./pages/QuotePage";
import CommunityPage from "./pages/CommunityPage";
import DestinationsPage from "./pages/DestinationsPage";
import DestinationGuidePage from "./pages/DestinationGuidePage";
import WhatsAppChatButton from "./components/WhatsAppChatButton";
import AIChatbot from "./components/AIChatbot";
import ItineraryGeneratorPage from "./pages/ItineraryGeneratorPage";
import OperationalPause from "./pages/OperationalPause";

import { trpc } from "./lib/trpc";

// GDPR imports
import CookieBanner from "./components/CookieBanner";
import CookiePolicy from "./pages/CookiePolicy";
import SubjectAccessRequest from "./pages/SubjectAccessRequest";
import RightToErasure from "./pages/RightToErasure";
import useSessionTimeout from "./hooks/useSessionTimeout";

function ProtectedRoute({ component: Component, requiredRole }: { component: React.ComponentType; requiredRole?: string }) {
  const { data: user, isLoading } = trpc.auth.me.useQuery();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) {
    window.location.href = "/login";
    return null;
  }
  if (requiredRole && (user as any).role !== requiredRole) {
    return <NotFound />;
  }
  return <Component />;
}

function SessionTimeoutWrapper({ children }: { children: React.ReactNode }) {
  const utils = trpc.useUtils();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSettled: () => {
      utils.auth.me.invalidate();
      window.location.href = '/login';
    },
  });

  useSessionTimeout(() => {
    logoutMutation.mutate();
  }, 30 * 60 * 1000); // 30 minutes

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/operational-pause" component={OperationalPause} />
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/set-password" component={SetPassword} />
      <Route path="/register" component={Register} />
      <Route path="/quote-request" component={QuoteRequest} />
      <Route path="/faq" component={FAQ} />
      <Route path="/flight-manager" component={FlightManager} />
      <Route path="/about" component={AboutUs} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-conditions" component={TermsConditions} />
      <Route path="/booking-intake" component={BookingIntakeForm} />
      <Route path="/refer/:code" component={ReferralLanding} />
      <Route path="/quote/:ref" component={QuotePage} />
      <Route path="/community" component={CommunityPage} />
      <Route path="/destinations" component={DestinationsPage} />
      <Route path="/destinations/:slug" component={DestinationGuidePage} />
      <Route path="/itinerarygenerator" component={ItineraryGeneratorPage} />

      {/* GDPR pages */}
      <Route path="/cookie-policy" component={CookiePolicy} />
      <Route path="/subject-access-request" component={SubjectAccessRequest} />
      <Route path="/right-to-erasure" component={RightToErasure} />

      {/* Protected routes */}
      <Route path="/loyalty" component={() => <ProtectedRoute component={LoyaltyDashboard} />} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/admin/loyalty" component={() => <ProtectedRoute component={AdminLoyalty} requiredRole="admin" />} />
      <Route path="/admin" component={() => <ProtectedRoute component={AdminDashboard} requiredRole="admin" />} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [hasPauseToken, setHasPauseToken] = React.useState(!!localStorage.getItem('pause-token'));
  const { data: publicSettings, isLoading: settingsLoading } = trpc.settings.getPublic.useQuery();

  const isOperationalPauseActive = publicSettings?.operational_pause_enabled === 'true';
  const showPausePage = isOperationalPauseActive && !hasPauseToken;

  // Show a minimal branded loader while we check if pause is active
  // (prevents flash of site content before redirecting to pause page)
  if (settingsLoading) {
    return (
      <ThemeProvider defaultTheme="light">
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0b2240 0%, #1a3a60 100%)' }}>
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
            <span className="text-amber-400 text-sm tracking-widest font-light uppercase">CB Travel</span>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider defaultTheme="light">
      <TooltipProvider>
        <SessionTimeoutWrapper>
          <ScrollToTop />
          <Toaster richColors position="top-right" />
          <div className="flex flex-col min-h-screen">
            {!showPausePage && <Navigation />}
            <main className="flex-1">
              {showPausePage ? <OperationalPause onUnlock={() => setHasPauseToken(true)} /> : <Router />}
            </main>
            {!showPausePage && <Footer />}
          </div>
          {/* Global floating buttons — hidden during pause */}
          {!showPausePage && <WhatsAppChatButton />}
          {!showPausePage && <AIChatbot />}
          {/* GDPR cookie consent banner */}
          <CookieBanner />
        </SessionTimeoutWrapper>
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
