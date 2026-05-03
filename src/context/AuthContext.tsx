import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { authApi } from "@/api/auth";
import { usersApi } from "@/api/users";
import type { User } from "@/api/types";

const TOKEN_KEY = "nautilus_token";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    projectCode?: string,
  ) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY),
  );
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const me = await usersApi.me();
      setUser(me);
    } catch {
      setToken(null);
      setUser(null);
      localStorage.removeItem(TOKEN_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      void fetchMe();
    } else {
      setIsLoading(false);
    }
  }, [token, fetchMe]);

  const login = async (email: string, password: string) => {
    const { accessToken } = await authApi.login(email, password);
    localStorage.setItem(TOKEN_KEY, accessToken);
    setToken(accessToken);
    const me = await usersApi.me();
    setUser(me);
  };

  const register = async (
    email: string,
    password: string,
    projectCode?: string,
  ) => {
    const { accessToken } = await authApi.register(
      email,
      password,
      projectCode,
    );
    localStorage.setItem(TOKEN_KEY, accessToken);
    setToken(accessToken);
    const me = await usersApi.me();
    setUser(me);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  const hasPermission = (permission: string) =>
    user?.permissions?.includes(permission) ?? false;

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, register, logout, hasPermission }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
};
