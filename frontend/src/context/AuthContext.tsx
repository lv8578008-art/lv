import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "../types";
import { api } from "../services/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAdmin: boolean;
  login: (mobile: string, password: string, remember?: boolean) => Promise<User>;
  register: (payload: any) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (updated: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("vip_auth_token"));
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const curToken = localStorage.getItem("vip_auth_token");
    if (!curToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const me = await api.getMe();
      setUser(me);
    } catch (err) {
      console.error("Failed to load user info:", err);
      localStorage.removeItem("vip_auth_token");
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (mobile: string, password: string, remember = false): Promise<User> => {
    const res = await api.login({ mobile, password, remember_device: remember });
    localStorage.setItem("vip_auth_token", res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    // Fetch full profile with active membership
    try {
      const full = await api.getMe();
      setUser(full);
      return full;
    } catch {
      return res.user;
    }
  };

  const register = async (payload: any): Promise<User> => {
    const res = await api.register(payload);
    localStorage.setItem("vip_auth_token", res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem("vip_auth_token");
    setToken(null);
    setUser(null);
  };

  const updateUser = (updated: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updated });
    }
  };

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAdmin,
        login,
        register,
        logout,
        refreshUser,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
