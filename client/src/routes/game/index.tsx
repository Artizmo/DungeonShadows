import { useCallback, useEffect } from "react";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import game from "~/core";
import GameHud from "~/components/game/GameHud";
import GameCanvas from "~/components/game/GameCanvas";
import { fetchGameTicket } from "~/services/auth";

export const Route = createFileRoute("/game/")({
  // 1. Guard: Enforce valid history state before the route even mounts
  beforeLoad: ({ location }) => {
    const state = location.state as Record<string, any>;
    const characterId = Number(state?.characterId);
    const playerId = Number(state?.playerId);

    if (!characterId || !playerId) {
      throw redirect({ to: "/login" });
    }

    return { characterId, playerId };
  },

  // 2. Loader: Resolve async engine initialization before rendering the UI
  loader: async ({ context }) => {
    const ticket = await fetchGameTicket(context.characterId, context.playerId);
    if (!ticket) {
      throw redirect({ to: "/login" });
    }

    console.log("🎯 Valid token acquired. Igniting engine core logic streams.");
    game.start(ticket);

    // Catch hooks up to fresh data on refresh
    game.events.emit("character_update");
  },

  component: GameComponent,
});

function GameComponent() {
  const router = useRouter();

  useEffect(() => {
    const handleDisconnect = () => {
      router.navigate({ to: "/login" });
    };
    game.network.events.on("player_disconnect", handleDisconnect);

    return () => {
      game.network.events.off("player_disconnect", handleDisconnect);
    };
  }, []);

  // Bind canvas to the persistent engine singleton
  const handleEngineResize = useCallback((canvas: HTMLCanvasElement) => {
    game.handleBindCanvas(canvas);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden bg-black select-none z-0 rpg-cursor-zone">
      <GameCanvas onResize={handleEngineResize} />
      <GameHud />
    </div>
  );
}
