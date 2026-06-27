import type Game from "~/core/game/Game";
import { GAME_SERVER_URL } from "~/_utils/constants";
import { Deserialize } from "~/shared/serialize/deserializer";
import { OpCode } from "~/shared/serialize/@types";
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
    console.log("🔌 Initializing connection...");

    const ws: ManagedWebSocket = new WebSocket(authenticatedUrl);
    ws.wasIntentionallyClosed = false;
    ws.binaryType = "arraybuffer";
    this.socket = ws;

    ws.onopen = () => {
      if (this.socket !== ws) return;
      console.log("⚔️ Connected securely to Dungeon Shadows Server");
      // The Game Server automatically starts the engine now, no manual "CONNECT" message required!
    };

    ws.onmessage = async (rawData) => {
      if (this.socket !== ws) return;

      // Handle Binary Streams (FlatBuffers)
      if (rawData.data instanceof ArrayBuffer) {
        const rawPacket = new Uint8Array(rawData.data);

        const opcodeNumber = rawPacket[0];
        const type = OpCode[opcodeNumber]; // "CHARACTER_SPAWN", "MAP_CHUNK_DATA", etc.
        const flatbufferBytes = rawPacket.subarray(1); // Pointer view slice (O(1) execution)

        // 🟢 Send the RAW binary payload straight to the route controller!
        this.handleSocketMessage({ type, data: flatbufferBytes });
        return;
      }

      // Handle Text Streams (JSON, fallback logs, chat messages)
      if (typeof rawData.data === "string") {
        try {
          const message = JSON.parse(rawData.data);

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

    ws.onerror = () => {};
  }

  private handleSocketMessage(message: any) {
    this.events.emit("ROUTE_RESPONSES", message);
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
