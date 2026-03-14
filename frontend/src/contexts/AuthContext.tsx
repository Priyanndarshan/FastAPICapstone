// React hooks for context, side effects, and state
import { createContext, useContext, useEffect, useState } from "react";
// Auth API: get current user, login, logout, register (aliased to avoid name clash with our login/register functions)
import { getMe, login as loginFn, logout as logoutFn, register as registerFn } from "../api/auth";

import type { User } from "../types";
// Everything the rest of the app can read/do from auth context
interface AuthContextType {
    user: User | null;           // current user or null if not logged in
    loading: boolean;            // true while we're checking for an existing session on first load
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

// Create the context; default is null so we can detect when used outside AuthProvider
const AuthContext = createContext<AuthContextType | null>(null);

// Wraps the app (or a subtree) and provides auth state and actions to all children
export function AuthProvider({ children }: { children: React.ReactNode }) {
    // Current user: set after login or getMe, cleared on logout or invalid token
    const [user, setUser] = useState<User | null>(null);
    // True until we've finished the initial "do we have a valid token?" check
    const [loading, setLoading] = useState(true);

    // Run once on mount: restore session if a token exists
    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (token) {
            // Token present: fetch user; on success set user, on failure clear tokens
            getMe()
                .then(setUser)   // success: store user in state
                .catch(() => {
                    // Invalid/expired token: clear tokens and user
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("refresh_token");
                    setUser(null);
                })
                .finally(() => setLoading(false));  // either way, initial check is done
        } else {
            // No token: we're not logged in; just stop loading
            setLoading(false);
        }
    }, []);

    // Call from Login page: sends credentials, then fetches and stores the current user
    async function login(email: string, password: string) {
        await loginFn(email, password);   // API call stores access_token + refresh_token in localStorage
        const me = await getMe();         // get profile so we have user in context
        setUser(me);
    }

    // Call from Register page: create account then log in automatically
    async function register(name: string, email: string, password: string) {
        await registerFn(name, email, password);   // create user on backend
        await login(email, password);              // log in and set user in context
    }

    // Call from Dashboard (or anywhere): hit logout API and clear user from context
    async function logout() {
        await logoutFn();   // API call + clears tokens from localStorage
        setUser(null);     // clear user so UI shows as logged out
    }

    // Provide auth state and functions to any component that uses useAuth()
    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

// Use this in any component that needs auth; throws if used outside AuthProvider
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}