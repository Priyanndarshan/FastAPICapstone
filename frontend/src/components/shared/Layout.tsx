import Navbar from "./Navbar";
import TopNav from "./TopNav";

const TOP_NAV_HEIGHT = "3.5rem";

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <TopNav />
            <div className="flex min-h-screen bg-slate-50" style={{ paddingTop: TOP_NAV_HEIGHT }}>
                <Navbar />
                <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-8 ml-56">
                    <div className="mx-auto max-w-5xl">{children}</div>
                </main>
            </div>
        </>
    );
}
