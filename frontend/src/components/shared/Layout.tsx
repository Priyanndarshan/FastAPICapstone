import Navbar from "./Navbar";

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-slate-50">
            <Navbar />
            <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-5xl">{children}</div>
            </main>
        </div>
    );
}
