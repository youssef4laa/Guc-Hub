import * as LocalAuthentication from "expo-local-authentication";
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";

import { createLogger } from "../logging";
import { hasStoredCredentials, loadCredentials } from "../storage/secureStore";
import { isDemoMode, setDemoMode } from "./demoMode";
import type { PortalCredentials } from "./LoginStrategy";
import { PortalSession } from "./PortalSession";
import { MockLoginStrategy } from "./strategies/MockLoginStrategy";
import { selectLoginStrategy } from "./selectLoginStrategy";

const log = createLogger("auth");

interface AuthContextValue {
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  demoMode: boolean;
  hasBiometricCredentials: boolean;
  login(credentials: PortalCredentials): Promise<void>;
  loginWithDemo(): Promise<void>;
  unlockWithBiometrics(): Promise<void>;
  logout(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const session = new PortalSession(selectLoginStrategy());
// Demo mode must never reach a real server, whatever EXPO_PUBLIC_PORTAL_AUTH_STRATEGY
// selects: its fake credentials would otherwise be sent to GUC as a login attempt.
const demoSession = new PortalSession(new MockLoginStrategy());

/**
 * Cross-cutting session state (like theme/query), not a "feature" — this is why it
 * lives in core/portal rather than src/features/auth, which owns only the login
 * screen UI. Any feature (settings' sign-out, the root layout's route guard) may
 * import this; features may never import each other directly.
 */
export function AuthProvider({ children }: PropsWithChildren) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [demoMode, setDemoModeState] = useState(false);
  const [hasBiometricCredentials, setHasBiometricCredentials] = useState(false);

  useEffect(() => {
    (async () => {
      setDemoModeState(await isDemoMode());
      setHasBiometricCredentials(await hasStoredCredentials());
      setIsBootstrapping(false);
    })();
  }, []);

  const login = async (credentials: PortalCredentials) => {
    await setDemoMode(false);
    await session.login(credentials);
    setDemoModeState(false);
    setIsAuthenticated(true);
    log.info("signed in");
  };

  const loginWithDemo = async () => {
    await setDemoMode(true);
    await demoSession.login({ username: "demo-student", password: "demo" }, { persist: false });
    setDemoModeState(true);
    setIsAuthenticated(true);
    log.info("entered demo mode");
  };

  const unlockWithBiometrics = async () => {
    const supported = await LocalAuthentication.hasHardwareAsync();
    if (!supported) throw new Error("Biometric unlock is not available on this device.");
    const result = await LocalAuthentication.authenticateAsync({ promptMessage: "Unlock Guc Hub" });
    if (!result.success) throw new Error("Biometric unlock was cancelled or failed.");
    const stored = await loadCredentials();
    if (!stored) throw new Error("No saved credentials to unlock.");
    await session.login(stored, { persist: false });
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await session.logout();
    setIsAuthenticated(false);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      isBootstrapping,
      demoMode,
      hasBiometricCredentials,
      login,
      loginWithDemo,
      unlockWithBiometrics,
      logout,
    }),
    [isAuthenticated, isBootstrapping, demoMode, hasBiometricCredentials],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
