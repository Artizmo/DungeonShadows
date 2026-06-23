import { createRootRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
    <>
      {/* Global persistent header navigation */}
      <nav className="p-4 bg-slate-950 text-white border-b border-slate-800 flex gap-4 items-center">
        <Link
          to="/"
          className="[&.active]:font-bold text-slate-300 [&.active]:text-white transition-colors text-sm hover:text-white"
        >
          Home
        </Link>

        <Link
          to="/login"
          className="[&.active]:font-bold text-slate-300 [&.active]:text-white transition-colors text-sm hover:text-white"
        >
          Login / Profile
        </Link>

        {/* 🔒 Arena link completely removed from general visibility rules. */}
        {/* Users must authenticating via the character profile selection matrix to route forward. */}
      </nav>

      {/* This is the window where index.tsx, login.tsx, or game.tsx injection happens! */}
      <Outlet />
    </>
  ),
});
