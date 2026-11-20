import clsx from "clsx";
import { NavLink, Outlet } from "react-router";

export function Layout() {
  const link = ({ isActive }: { isActive: boolean }) =>
    clsx(
      "rounded-lg px-3 py-2 text-sm font-medium",
      isActive ? "bg-violet-50 text-violet-700" : "text-slate-600 hover:bg-slate-100",
    );

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <span className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <span className="flex size-8 items-center justify-center rounded-lg bg-violet-600 text-sm text-white">
              Q
            </span>
            Qist
          </span>
          <nav aria-label="Main" className="flex gap-1">
            <NavLink to="/" end className={link}>
              Checkout
            </NavLink>
            <NavLink to="/merchant" className={link}>
              Merchant portal
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="py-6 text-center text-xs text-slate-400">
        Demo project — fictional merchant, data and credit decisions.
      </footer>
    </div>
  );
}
