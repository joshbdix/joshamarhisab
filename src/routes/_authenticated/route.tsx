import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { BarChart3, CalendarRange, LayoutDashboard, LogOut, Search, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

const NAV = [
  { to: "/", label: "ড্যাশবোর্ড", icon: LayoutDashboard },
  { to: "/months", label: "মাসের হিসাব", icon: CalendarRange },
  { to: "/reports", label: "রিপোর্ট", icon: BarChart3 },
  { to: "/search", label: "অনুসন্ধান", icon: Search },
  { to: "/settings", label: "সেটিংস", icon: Settings },
] as const;

function AuthenticatedLayout() {
  const { session, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth" });
  }, [loading, session, navigate]);

  if (loading || !session) {
    return <p className="py-24 text-center text-sm text-muted-foreground">লোড হচ্ছে…</p>;
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <header className="sticky top-0 z-30 border-b bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="text-lg font-bold text-primary">
            আমার হিসাব
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary [&.active]:bg-secondary [&.active]:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Button variant="ghost" size="sm" className="gap-1" onClick={() => signOut()}>
            <LogOut className="h-4 w-4" /> লগআউট
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-card md:hidden">
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.to === "/" }}
            className="flex flex-col items-center gap-1 py-2 text-[11px] text-muted-foreground [&.active]:text-primary"
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
