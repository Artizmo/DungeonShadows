import { GAME_SERVER_URL } from "~/_utils/constants";
import EventEmitter from "eventemitter3";

const URL = `ws://${GAME_SERVER_URL || "localhost:8000"}`;

interface ManagedWebSocket extends WebSocket {
  wasIntentionallyClosed?: boolean;
}

export class Client {
  public events: EventEmitter = new EventEmitter();
  public playerId: number = 0;
  public characterId: number = 0;
  private socket: ManagedWebSocket | null = null;

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

    const decoded = this.decodeTicket(ticket);
    if (decoded) {
      this.playerId = Number(decoded.playerId);
      this.characterId = Number(decoded.characterId);
      console.log(
        `🎯 Client hydrated local state: Player ${this.playerId}, Character ${this.characterId}`,
      );
    }

    const authenticatedUrl = `${URL}?ticket=${encodeURIComponent(ticket)}`;
    console.log("🔌 Initializing connection...");
    const ws: ManagedWebSocket = new WebSocket(authenticatedUrl);
    ws.wasIntentionallyClosed = false;
    ws.binaryType = "arraybuffer";
    this.socket = ws;

    ws.onopen = () => {
      if (this.socket !== ws) return;
      console.log("⚔️ Connected securely to Dungeon Shadows Server");
    };

    ws.onmessage = async (rawData) => {
      if (this.socket !== ws) return;

      if (rawData.data instanceof ArrayBuffer) {
        const data = new Uint8Array(rawData.data);
        this.events.emit("world_state", data);
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
        return;
      }
    };

    ws.onclose = () => {
      console.log("🛑 Client disconnected from game server.");
    };

    ws.onerror = (error) => {
      console.log(`🛑 Client error: ${error}!`);
    };
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

  public sendBinary(bytes: Uint8Array): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

    this.socket.send(bytes.buffer);
  }

  public sendJson(type: string, data: any = null): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

    const payload =
      typeof data === "string" ? data : JSON.stringify({ type, data });
    this.socket.send(payload);
  }
}
