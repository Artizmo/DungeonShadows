import WebSocket from "ws";
import readline from "readline";
import Log from "~/core/Logger";

const SERVER_URL = "ws://127.0.0.1:8000";

let ws: WebSocket | null = null;
let isClosingCleanly = false;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function clearPromptLine(): void {
  readline.cursorTo(process.stdout, 0);
  readline.clearLine(process.stdout, 1);
}

function connect(url: string = SERVER_URL): Promise<void> {
  return new Promise((resolve, reject) => {
    Log.TEST.INFO(`Connecting to DungeonShadows...`);
    isClosingCleanly = false;

    ws = new WebSocket(url, {
      headers: { origin: "http://localhost:3000" }
    });

    ws.on("open", () => {
      clearPromptLine();
      Log.TEST.INFO("Connected!");

      // Handshake packet establishing player state
      sendCommand("CONNECT", {
        pid: 3,
        token: "mock_jwt_session_token_12345"
      });

      rl.prompt(true);
      resolve();
    });

    ws.on("message", (rawBuffer: WebSocket.Data) => {
      try {
        const packet = JSON.parse(rawBuffer.toString());

        clearPromptLine();

        if (packet.type === "ERROR") {
          Log.TEST.ERROR(packet.data.message || packet.data);
          rl.prompt(true);
          return;
        }

        // Log.TEST.INFO(`Response: ${packet.type}`);
        if (packet.data && typeof packet.data === "object") {
          Log.DATA.INFO(JSON.stringify(packet.data, null, 2));
        } else {
          Log.DATA.INFO(packet.data || "No data payload attached.");
        }

        rl.prompt(true);
      } catch (error) {
        clearPromptLine();
        Log.TEST.ERROR(`Failed to parse response: ${error}`);
        rl.prompt(true);
      }
    });

    ws.on("error", (error) => {
      clearPromptLine();
      Log.TEST.ERROR(`Socket error: ${error.message}`);
      rl.prompt(true);
      reject(error);
    });

    ws.on("close", () => {
      clearPromptLine();
      if (isClosingCleanly) {
        Log.TEST.INFO("Connection closed cleanly.");
      } else {
        Log.TEST.WARN("Connection closed unexpectedly.");
      }
      rl.close();
    });
  });
}

function sendCommand(type: string, data: any = {}): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify({ type, data }));
}

function startTerminalLoop(): void {
  rl.setPrompt("DungeonPrompt> ");
  rl.prompt();

  rl.on("line", (line) => {
    const input = line.trim();
    if (!input) {
      rl.prompt();
      return;
    }

    const args = input.split(/\s+/);
    const command = args[0].toLowerCase();

    switch (command) {
      // 1. Keep infrastructure and lifecycle commands local to the client state configuration
      case "join":
        sendCommand("JOIN_WORLD", { cid: parseInt(process.env.CID || "1", 10) });
        break;

      case "leave":
        sendCommand("LEAVE_WORLD");
        break;

      case "clear":
        process.stdout.write("\u001b[2J\u001b[0;0H");
        rl.prompt();
        break;

      case "quit":
      case "exit":
        isClosingCleanly = true;
        // Clean cleanup notification to server
        sendCommand("LEAVE_WORLD");
        setTimeout(() => {
          ws?.close();
          rl.close();
          process.exit(0);
        }, 100);
        break;

      // 2. Fallback: Any custom, multi-word or dynamic string gets dropped down here
      default:
        // Captures inputs like: "drink waterskin", "put item container", "score", "sleep"
        // Server will receive: { type: "TEXT_INPUT", data: "drink waterskin" }
        sendCommand("TEXT_INPUT", input);
        break;
    }
  });
}

async function runInteractiveClient() {
  try {
    await connect();
    startTerminalLoop();
  } catch (error) {
    clearPromptLine();
    Log.TEST.ERROR("Failed to initialize test client.");
  }
}

runInteractiveClient();