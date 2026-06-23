import { useState } from "react";
import type Character from "~/core/Character";
import { AUTH_API_URL } from "~/utils/constants";

interface CredentialFormManagerProps {
  onAuthSuccess: (playerId: number, characters: Character[]) => void;
}

export default function CredentialFormManager({
  onAuthSuccess,
}: CredentialFormManagerProps) {
  const [email, setEmail] = useState("luke.skywalker@tatooine.net");
  const [password, setPassword] = useState("password123");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.includes("@")) {
      setErrorMessage("Please enter a valid adventurer email address.");
      return;
    }

    if (password.length < 4) {
      setErrorMessage("Credential security key must be at least 4 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${AUTH_API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to authenticate with the realm.",
        );
      }

      onAuthSuccess(data.playerId, data.characters || []);
    } catch (err: any) {
      setErrorMessage(err.message || "Connection to the login node timed out.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleLoginSubmit}
      noValidate
      className="space-y-5 relative"
    >
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
          Email Address
        </label>
        <input
          type="email"
          value={email}
          disabled={isSubmitting}
          onChange={(e) => {
            setEmail(e.target.value);
            setErrorMessage(null);
          }}
          placeholder="adventurer@realm.com"
          className="w-full bg-slate-900 border border-slate-800 px-4 py-2.5 text-white text-sm rounded-lg focus:outline-none focus:border-indigo-500 transition disabled:opacity-50"
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
          Password
        </label>
        <input
          type="password"
          value={password}
          disabled={isSubmitting}
          onChange={(e) => {
            setPassword(e.target.value);
            setErrorMessage(null);
          }}
          placeholder="••••••••"
          className="w-full bg-slate-900 border border-slate-800 px-4 py-2.5 text-white text-sm rounded-lg focus:outline-none focus:border-indigo-500 transition disabled:opacity-50"
        />
      </div>

      <div className="relative h-12 w-full">
        {errorMessage && (
          <div className="absolute left-0 top-1 w-full bg-red-950/90 border border-red-800/60 text-red-400 text-xs px-4 py-2.5 rounded-lg flex items-center gap-2">
            <span>⚠️</span>
            {errorMessage}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:opacity-60 font-bold rounded-lg transition shadow-lg shadow-indigo-600/20 active:translate-y-0.5 flex justify-center items-center text-white"
      >
        {isSubmitting ? "Opening Portal..." : "Authenticate Connection"}
      </button>
    </form>
  );
}
