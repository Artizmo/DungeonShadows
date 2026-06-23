interface LoginLayoutProps {
  viewStep: "CREDENTIALS" | "PROFILE_SELECTION";
  children: React.ReactNode;
}

export default function LoginLayout({ viewStep, children }: LoginLayoutProps) {
  return (
    <div className="min-h-[calc(100vh-61px)] bg-slate-900 text-white flex flex-col items-center justify-center p-6 select-none gap-6">
      <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-8 relative">
          <h2 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-purple-400">
            DUNGEON SHADOWS
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1 uppercase tracking-widest">
            {viewStep === "CREDENTIALS"
              ? "Account Authentication"
              : "Select Your Character"}
          </p>
        </div>

        {children}
      </div>
    </div>
  );
}
