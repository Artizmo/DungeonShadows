import EventEmitter from "eventemitter3";

const GAME_SERVER_URL = import.meta.env.VITE_GAME_SERVER_URL;
const WS_URL = `ws://${GAME_SERVER_URL || "localhost:8000"}`;

interface ManagedWebSocket extends WebSocket {
  wasIntentionallyClosed?: boolean;
}

// 🟢 1. Extracted JWT logic out of the network class.
// (Even better: move this to a dedicated `utils/jwt.ts` file later)
function decodeTicket(
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

export default class Client {
  public readonly events = new EventEmitter();

  // 🟢 2. Use null to represent unauthenticated states, preventing accidental "ID 0" bugs
  public playerId: number | null = null;
  public characterId: number | null = null;

  private socket: ManagedWebSocket | null = null;

  public connect(ticket: string): void {
    this.disconnect();

    const decoded = decodeTicket(ticket);
    if (decoded) {
      this.playerId = Number(decoded.playerId);
      this.characterId = Number(decoded.characterId);
      console.log(
        `🎯 Client hydrated local state: Player ${this.playerId}, Character ${this.characterId}`,
      );
    }

    const authenticatedUrl = `${WS_URL}?ticket=${encodeURIComponent(ticket)}`;
    console.log("🔌 Initializing connection...");

    const ws: ManagedWebSocket = new WebSocket(authenticatedUrl);
    ws.wasIntentionallyClosed = false;
    ws.binaryType = "arraybuffer";
    this.socket = ws;

    ws.onopen = () => {
      if (this.socket !== ws) return;
      console.log("⚔️ Connected securely to Dungeon Shadows Server");
    };

    ws.onmessage = (rawData) => {
      if (this.socket !== ws) return;

      if (rawData.data instanceof ArrayBuffer) {
        this.events.emit("world_state", new Uint8Array(rawData.data));
        return;
      }

      if (typeof rawData.data === "string") {
        try {
          // const message = JSON.parse(rawData.data);
          // Handle legacy JSON routes here...
        } catch (parseError) {
          console.warn(
            "Received raw string text that isn't valid JSON:",
            rawData.data,
          );
        }
      }
    };

    ws.onclose = () => {
      console.log("🛑 Client disconnected from game server.");
    };

    ws.onerror = (error) => {
      // 🟢 3. Pass the object directly so the browser console expands it properly!
      console.error("🛑 Client error:", error);
    };
  }

  public disconnect(): void {
    if (!this.socket) return;

    this.socket.wasIntentionallyClosed = true;

    // Unbind handlers to prevent memory leaks or phantom events
    this.socket.onopen = null;
    this.socket.onmessage = null;
    this.socket.onerror = null;
    this.socket.onclose = null; // Added onclose cleanup for safety

    if (
      this.socket.readyState === WebSocket.OPEN ||
      this.socket.readyState === WebSocket.CONNECTING
    ) {
      this.socket.close(1000, "Component unmounted");
    }

    this.socket = null;
    this.playerId = null;
    this.characterId = null;
  }

  public sendBinary(bytes: Uint8Array): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(bytes.buffer);
    }
  }

  // 🟢 4. Fixed JSON payload construction
  public sendJson(type: string, data: unknown = null): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, data }));
    }
  }
}
