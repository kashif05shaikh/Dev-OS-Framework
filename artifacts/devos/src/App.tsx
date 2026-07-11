import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useAuth } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { setAuthTokenGetter } from '@workspace/api-client-react';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { QueryClientProvider, useQueryClient, QueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";

import LandingPage from "./pages/landing";
import HomePage from "./pages/home";
import LearningPage from "./pages/learning";
import NotesPage from "./pages/notes";
import CodingPage from "./pages/coding";
import ProjectsPage from "./pages/projects";
import JobsPage from "./pages/jobs";
import ResumePage from "./pages/resume";
import AiPage from "./pages/ai";
import DevToolsPage from "./pages/devtools";
import NetworkPage from "./pages/network";
import CalendarPage from "./pages/calendar";
import GoalsPage from "./pages/goals";
import FocusPage from "./pages/focus";
import NotificationsPage from "./pages/notifications";
import AnalyticsPage from "./pages/analytics";
import SettingsPage from "./pages/settings";
import NotFound from "./pages/not-found";

import { AppShell } from "./components/layout/app-shell";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(22 100% 55%)",
    colorForeground: "hsl(220 15% 15%)",
    colorMutedForeground: "hsl(220 10% 45%)",
    colorDanger: "hsl(0 84% 60%)",
    colorBackground: "hsl(40 20% 98%)",
    colorInput: "hsl(40 10% 85%)",
    colorInputForeground: "hsl(220 15% 15%)",
    colorNeutral: "hsl(40 10% 85%)",
    fontFamily: "'Bricolage Grotesque', sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-card rounded-2xl w-[440px] max-w-full overflow-hidden border border-border shadow-lg",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-2xl font-bold tracking-tight text-foreground",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "text-foreground font-medium",
    formFieldLabel: "text-foreground font-medium",
    footerActionLink: "text-primary hover:text-primary/90 font-medium",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground",
    identityPreviewEditButton: "text-primary",
    formFieldSuccessText: "text-green-600",
    alertText: "text-destructive",
    logoBox: "h-12 w-12 mx-auto mb-4",
    logoImage: "w-full h-full object-contain",
    socialButtonsBlockButton: "border border-border hover:bg-secondary/50 transition-colors",
    formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground font-medium",
    formFieldInput: "bg-background border-border text-foreground focus:ring-primary focus:border-primary",
    footerAction: "bg-secondary/20 p-6 border-t border-border mt-6",
    dividerLine: "bg-border",
    alert: "bg-destructive/10 border border-destructive/20 rounded-md",
    otpCodeFieldInput: "border-border bg-background text-foreground",
    formFieldRow: "gap-4",
    main: "p-6 sm:p-8",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

/**
 * Registers a Clerk session token getter with the shared API fetch client so
 * every API call includes `Authorization: Bearer <token>`.  This is required
 * because cookie-based Clerk auth doesn't work cross-domain in the Replit
 * proxied setup — the dev-browser cookie is scoped to Clerk's domain and
 * never reaches this app's API server.
 */
function ClerkAuthTokenSync() {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    setAuthTokenGetter(async () => {
      if (!isSignedIn) return null;
      try {
        return await getToken();
      } catch {
        return null;
      }
    });
    return () => {
      setAuthTokenGetter(null);
    };
  }, [getToken, isSignedIn]);

  return null;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/home" />
      </Show>
      <Show when="signed-out">
        <LandingPage />
      </Show>
    </>
  );
}

function ProtectedRoute({ component: Component, ...rest }: any) {
  return (
    <Route {...rest}>
      <Show when="signed-in">
        <AppShell>
          <Component />
        </AppShell>
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </Route>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Access DevOS",
            subtitle: "Enter your command deck",
          },
        },
        signUp: {
          start: {
            title: "Initialize DevOS",
            subtitle: "Create your command deck",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkAuthTokenSync />
        <ClerkQueryClientCacheInvalidator />
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          
          <ProtectedRoute path="/home" component={HomePage} />
          <ProtectedRoute path="/learning" component={LearningPage} />
          <ProtectedRoute path="/notes" component={NotesPage} />
          <ProtectedRoute path="/coding" component={CodingPage} />
          <ProtectedRoute path="/projects" component={ProjectsPage} />
          <ProtectedRoute path="/jobs" component={JobsPage} />
          <ProtectedRoute path="/resume" component={ResumePage} />
          <ProtectedRoute path="/ai" component={AiPage} />
          <ProtectedRoute path="/devtools" component={DevToolsPage} />
          <ProtectedRoute path="/network" component={NetworkPage} />
          <ProtectedRoute path="/calendar" component={CalendarPage} />
          <ProtectedRoute path="/goals" component={GoalsPage} />
          <ProtectedRoute path="/focus" component={FocusPage} />
          <ProtectedRoute path="/notifications" component={NotificationsPage} />
          <ProtectedRoute path="/analytics" component={AnalyticsPage} />
          <ProtectedRoute path="/settings" component={SettingsPage} />
          
          <Route component={NotFound} />
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <TooltipProvider>
        <WouterRouter base={basePath}>
          <ClerkProviderWithRoutes />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
