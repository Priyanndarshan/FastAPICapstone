import api from "./client";

export async function register(name: string, email: string, password: string, phone?: string | null) {
    const res = await api.post("/auth/register", { name, email, password, phone: phone ?? undefined });
    return res.data; // returns { id, name, email, phone }
}

export async function login(email: string, password: string) {
    // Backend expects application/x-www-form-urlencoded (OAuth2PasswordRequestForm)
    const form = new URLSearchParams();
    form.append("username", email); // FastAPI OAuth2 form uses "username" for email
    form.append("password", password);

    const res = await api.post("/auth/login", form.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    localStorage.setItem("access_token", res.data.access_token);
    localStorage.setItem("refresh_token", res.data.refresh_token);
}

export async function getMe() {
    const res = await api.get("/auth/me"); // token auto-attached by interceptor
    return res.data;
}

export async function updateProfile(data: { name?: string; phone?: string | null }) {
    const res = await api.patch("/auth/me", data);
    return res.data; // returns updated user { id, name, email, phone }
}

export async function logout() {
    const refresh_token = localStorage.getItem("refresh_token");
    // Backend expects JSON body { "refresh_token": "..." }, not query param
    if (refresh_token) {
        await api.post("/auth/logout", { refresh_token });
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
}