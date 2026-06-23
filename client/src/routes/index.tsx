import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <div className="p-6 bg-slate-900 text-white min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-extrabold tracking-tight text-indigo-400">
        Welcome to Dungeon Shadows
      </h1>
      {/* Replaced direct link with an authentication boundary gateway link */}
      <Link
        to="/login"
        className="mt-6 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold transition shadow-lg shadow-indigo-600/20"
      >
        Login to your profile
      </Link>
    </div>
  );
}
