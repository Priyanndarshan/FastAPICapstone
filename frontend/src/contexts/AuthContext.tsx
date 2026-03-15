import { createContext, useContext, useEffect, useState } from "react";
import { getMe, login as loginFn, logout as logoutFn, register as registerFn, updateProfile as updateProfileFn } from "../api/auth";

import type { User } from "../types";
interface AuthContextType {
    user: User | null;           // current user or null if not logged in
    loading: boolean;            // true while we're checking for an existing session on first load
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string, phone?: string | null) => Promise<void>;
    logout: () => Promise<void>;
    updateProfile: (data: { name?: string; phone?: string | null }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (token) {
            getMe()
                .then(setUser)   // success: store user in state
                .catch(() => {
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("refresh_token");
                    setUser(null);
                })
                .finally(() => setLoading(false));  // either way, initial check is done
        } else {
            setLoading(false);
        }
    }, []);

    async function login(email: string, password: string) {
        await loginFn(email, password);   // API call stores access_token + refresh_token in localStorage
        const me = await getMe();         // get profile so we have user in context
        setUser(me);
    }

    async function register(name: string, email: string, password: string, phone?: string | null) {
        await registerFn(name, email, password, phone);   // create user on backend
        await login(email, password);              // log in and set user in context
    }

    async function logout() {
        await logoutFn();   // API call + clears tokens from localStorage
        setUser(null);     // clear user so UI shows as logged out
    }

    async function updateProfile(data: { name?: string; phone?: string | null }) {
        const updated = await updateProfileFn(data);
        setUser(updated);
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}