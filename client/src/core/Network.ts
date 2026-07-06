import EventEmitter from "eventemitter3";
import { decodeTicket } from "~/services/auth";
import { Log } from "~/shared/core/Logger";
import { Deserialize } from "~/shared/network/deserializer";

const GAME_SERVER_URL = import.meta.env.VITE_GAME_SERVER_URL;
const WS_URL = `ws://${GAME_SERVER_URL || "localhost:8000"}`;

interface ManagedWebSocket extends WebSocket {
  wasIntentionallyClosed?: boolean;
}

export default class Network {
  readonly events = new EventEmitter();
  playerId: number | null = null;
  characterId: number | null = null;
  packetQueue: Uint8Array[] = [];
  private socket: ManagedWebSocket | null = null;

  public connect(ticket: string): void {
    this.disconnect();

    const decoded = decodeTicket(ticket);
    if (decoded) {
      this.playerId = Number(decoded.playerId);
      this.characterId = Number(decoded.characterId);
      Log.NETWORK.INFO(
        `🎯 Client hydrated local state: Player ${this.playerId}, Character ${this.characterId}`,
      );
    }

    const authenticatedUrl = `${WS_URL}?ticket=${encodeURIComponent(ticket)}`;
    Log.NETWORK.INFO("🔌 Initializing connection...");

    const ws: ManagedWebSocket = new WebSocket(authenticatedUrl);
    ws.wasIntentionallyClosed = false;
    ws.binaryType = "arraybuffer";
    this.socket = ws;

    ws.onopen = () => {
      if (this.socket !== ws) return;
      Log.NETWORK.INFO("⚔️ Connected securely to Dungeon Shadows Server");
    };

    ws.onmessage = (message) => {
      if (this.socket !== ws) return;
      if (!message.isTrusted) return;

      const packet = message.data;
      if (!packet) return;

      this.packetQueue.push(packet);
    };

    ws.onclose = () => {
      Log.NETWORK.WARN("⚠️ Client disconnected from game server.");
    };

    ws.onerror = (error) => {
      Log.NETWORK.ERROR(`🛑 Client error: ${error}.`);
    };
  }

  public send(bytes: Uint8Array): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(bytes.buffer);
    }
  }

  public disconnect(): void {
    if (!this.socket) return;

    this.socket.wasIntentionallyClosed = true;
    this.socket.onopen = null;
    this.socket.onmessage = null;
    this.socket.onerror = null;
    this.socket.onclose = null;

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
}
