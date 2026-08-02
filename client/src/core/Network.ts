import EventEmitter from "eventemitter3";
import { decodeTicket } from "~/services/auth";
import { Log } from "~/shared/core/Logger";

const GAME_SERVER_URL = import.meta.env.VITE_GAME_SERVER_URL;
const WS_URL = `ws://${GAME_SERVER_URL || "localhost:8000"}`;

interface ManagedWebSocket extends WebSocket {
  wasIntentionallyClosed?: boolean;
}

export default class Network {
  playerId: number | null = null;
  characterId: number | null = null;
  packetQueue: Uint8Array[] = [];
  readonly events = new EventEmitter();
  private socket: ManagedWebSocket | null = null;

  constructor() {
    if (import.meta.hot) {
      if (!this.socket) return;
      this.socket.close(1000, "Component unmounted");
    }
  }

  connect(ticket: string): void {
    this.disconnect();

    const decoded = decodeTicket(ticket);
    if (decoded) {
      this.playerId = Number(decoded.playerId);
      this.characterId = Number(decoded.characterId);
      Log.NETWORK.INFO(
        `🎯 Client hydrated local state: Player ${this.playerId}, Character ${this.characterId}`
      );
    }

    const authenticatedUrl = `${WS_URL}?ticket=${encodeURIComponent(ticket)}`;
    Log.NETWORK.INFO("🔌 Initializing connection...");

    const width = window.innerWidth;
    const height = window.innerHeight;
    const protocolPayload = `dimensions-${width}x${height}`;
    const ws: ManagedWebSocket = new WebSocket(
      authenticatedUrl,
      protocolPayload
    );
    ws.wasIntentionallyClosed = false;
    ws.binaryType = "arraybuffer";
    this.socket = ws;

    ws.onopen = () => {
      if (this.socket !== ws) return;
      Log.NETWORK.INFO("⚔️ Connected securely to Dungeon Shadows Server");
    };

    ws.onmessage = async (message) => {
      let packet: Uint8Array;

      if (message.data instanceof ArrayBuffer) {
        packet = new Uint8Array(message.data);
      } else if (message.data instanceof Blob) {
        const arrayBuffer = await message.data.arrayBuffer();
        packet = new Uint8Array(arrayBuffer);
      } else {
        return; // Ignore text or malformed frames
      }

      if (packet.length === 0) return;

      this.packetQueue.push(packet);
    };

    ws.onclose = () => {
      this.disconnect();
      Log.NETWORK.WARN("⚠️ Client disconnected from game server.");
    };

    ws.onerror = (error) => {
      Log.NETWORK.ERROR(`🛑 Client error: ${error}.`);
    };
  }

  send(bytes: Uint8Array): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(bytes.buffer);
    }
  }

  disconnect(): void {
    if (!this.socket) return;

    this.events.emit("player_disconnect", this.characterId);

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
