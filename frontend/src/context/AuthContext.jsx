import { createContext, useContext, useEffect, useState } from "react";
import { api, get, errorMessage } from "../services/api";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  async function refresh() {
    setLoading(true);
    setError("");
    try {
      setUser(await get("/auth/me"));
    } catch (e) {
      if (e.response?.status !== 401) setError(errorMessage(e));
      setUser(null);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.readingSize = user?.readingSize || "DEFAULT";
    root.dataset.density = user?.density || "COMFORTABLE";
    root.dataset.reduceMotion = String(user?.reduceMotion || false);
  }, [user]);
  async function signIn(mode, input) {
    const res = await api.post(`/auth/${mode}`, input);
    setUser(res.data.data);
    return res.data.data;
  }
  async function signOut() {
    await api.post("/auth/logout");
    setUser(null);
  }
  return (
    <AuthContext.Provider
      value={{ user, setUser, loading, error, refresh, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
