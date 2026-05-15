import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authService } from "../services/authService";
import type { CurrentUser, LoginDto, UserRoleName } from "../types";
import { UserRole } from "../types";

interface AuthContextValue {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (dto: LoginDto) => Promise<CurrentUser>;
  logout: () => void;
  hasRole: (...roles: UserRoleName[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const roleToName: Record<number, UserRoleName> = {
  [UserRole.Admin]: "Admin",
  [UserRole.Doktor]: "Doktor",
  [UserRole.Sekreter]: "Sekreter",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(() =>
    authService.getStoredUser()
  );
  const [isLoading, setIsLoading] = useState<boolean>(
    () => !!authService.getStoredToken()
  );

  useEffect(() => {
    const token = authService.getStoredToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    authService
      .me()
      .then((fresh) => {
        if (cancelled) return;
        setUser(fresh);
        authService.storeSession(token, fresh);
      })
      .catch(() => {
        if (cancelled) return;
        authService.logout();
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (dto: LoginDto) => {
    const res = await authService.login(dto);
    const currentUser: CurrentUser = {
      id: res.id,
      email: res.email,
      name: res.name,
      role: res.role,
      roleText: res.roleText,
      doctorId: res.doctorId ?? null,
    };
    authService.storeSession(res.token, currentUser);
    setUser(currentUser);
    return currentUser;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (...roles: UserRoleName[]) => {
      if (!user) return false;
      const name = roleToName[user.role];
      return roles.includes(name);
    },
    [user]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      hasRole,
    }),
    [user, isLoading, login, logout, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth, AuthProvider içinde kullanılmalıdır.");
  return ctx;
}
