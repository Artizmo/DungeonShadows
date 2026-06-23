import type Game from "~/core/Game";
import { GAME_SERVER_URL } from "~/utils/constants";

const URL = `ws://${GAME_SERVER_URL || "localhost:8000"}`;

interface ManagedWebSocket extends WebSocket {
  wasIntentionallyClosed?: boolean;
}

export class Client {
  private socket: ManagedWebSocket | null = null;
  public readonly game: Game | null = null;

  // Keep these properties tracked locally on the instance
  public playerId: number = 0;
  public characterId: number = 0;

  constructor(game: Game) {
    this.game = game;
  }

  /**
   * Helper method to decode a JWT payload on the client side without verification
   */
  private decodeTicket(
    ticket: string,
  ): { playerId: number; characterId: number } | null {
    try {
      const base64Url = ticket.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      );
      return JSON.parse(jsonPayload);
    } catch (err) {
      console.error("Failed to decode token locally on client:", err);
      return null;
    }
  }

  connect(ticket: string) {
    this.disconnect();

    // 1. Decode the ticket locally to hydrate Client properties
    const decoded = this.decodeTicket(ticket);
    if (decoded) {
      this.playerId = Number(decoded.playerId);
      this.characterId = Number(decoded.characterId);
      console.log(
        `🎯 Client hydrated local state: Player ${this.playerId}, Character ${this.characterId}`,
      );
    }

    // 2. Build the secure URL string using the single-use ticket
    const authenticatedUrl = `${URL}?ticket=${encodeURIComponent(ticket)}`;
    console.log("🔌 Initializing secure socket connection...");

    const ws: ManagedWebSocket = new WebSocket(authenticatedUrl);
    ws.wasIntentionallyClosed = false;
    this.socket = ws;

    ws.onopen = () => {
      if (this.socket !== ws) return;
      console.log("⚔️ Connected securely to Dungeon Shadows Server");
      // The Game Server automatically starts the engine now, no manual "CONNECT" message required!
    };

    ws.onmessage = (rawData) => {
      if (this.socket !== ws) return;

      try {
        const message = JSON.parse(rawData.data);
        this.handleSocketMessage(message);
      } catch (err) {
        console.error("Failed to parse incoming server packet:", err);
      }
    };

    ws.addEventListener("close", (event) => {
      console.error("Socket closed by client!", {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
      });

      // 🎯 Add a stack trace to see what code triggered the close
      console.trace("Who called close()?");
    });

    ws.onerror = () => {};
  }

  private handleSocketMessage(message: any) {
    if (!this.game) return;
    this.game.routeResponses(message);
  }

  disconnect() {
    if (this.socket) {
      this.socket.wasIntentionallyClosed = true;

      this.socket.onopen = null;
      this.socket.onmessage = null;
      this.socket.onerror = null;

      if (
        this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING
      ) {
        this.socket.close(1000, "Component unmounted");
      }

      this.socket = null;
    }
  }

  send(type: string, data: any = null) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, data }));
    }
  }
}
