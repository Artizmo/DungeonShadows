import WebSocket from "ws";
import readline from "readline";
import Logger from "~/core/Logger";

const TestLog = new Logger("TEST");
const DataLog = new Logger("DATA");
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
    TestLog.info(`Connecting to ${url}...`);
    isClosingCleanly = false;

    ws = new WebSocket(url, {
      headers: { origin: "http://localhost:3000" }
    });

    ws.on("open", () => {
      clearPromptLine();
      TestLog.info("Connected!");

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
          TestLog.error(packet.data);
          rl.prompt(true);
          return;
        }

        TestLog.info(`Response: ${packet.type}`);
        DataLog.info(JSON.stringify(packet.data, null, 2));

        rl.prompt(true);
      } catch (error) {
        clearPromptLine();
        TestLog.error(`Failed to parse response: ${error}`);
        rl.prompt(true);
      }
    });

    ws.on("error", (error) => {
      clearPromptLine();
      TestLog.error(`Socket error: ${error.message}`);
      rl.prompt(true);
      reject(error);
    });

    ws.on("close", () => {
      sendCommand("LEAVE_WORLD");
      clearPromptLine();
      if (isClosingCleanly) {
        TestLog.info("Connection closed cleanly.");
      } else {
        TestLog.error("Connection closed unexpectedly.");
      }
      rl.close();
    });
  });
}

function sendCommand(type: string, data: Record<string, any> = {}): void {
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

    const args = input.split(" ");
    const command = args[0].toLowerCase();

    switch (command) {
      case "join":
        sendCommand("JOIN_WORLD", { cid: parseInt(process.env.CID) });
        break;

      case "leave":
        sendCommand("LEAVE_WORLD");
        break;

      case "save":
        sendCommand("SAVE");
        break;

      case "inventory":
        sendCommand("CHECK_INVENTORY");
        break;

      case "drop":
        const itemId = args[1];
        if (!itemId) {
          clearPromptLine();
          TestLog.warn("Usage: drop <item_id>");
          rl.prompt(true);
          break;
        }
        sendCommand("DROP_ITEM", { itemId, quantity: 1 });
        break;

      case "quit":
      case "exit":
        isClosingCleanly = true;
        ws?.close();
        rl.close();
        process.exit(0);

      default:
        clearPromptLine();
        TestLog.warn(`Unknown local command: "${command}". (Available: inventory, drop [id], quit)`);
        rl.prompt(true);
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
    TestLog.error("Failed to initialize test client.");
  }
}

runInteractiveClient();