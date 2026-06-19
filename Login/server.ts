import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Fix for ES Modules __dirname if you are using them, otherwise just use __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Force Node to look exactly inside your Login directory for the .env file
dotenv.config({ path: path.resolve(__dirname, ".env") });

import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import cors from "cors";
import Log from "~/core/Logger.ts";
import type * as Express from "express";

// Bring in your global Star Wars & custom player datasets
import { playersData, charactersData } from "../data/mock/mock.ts";
import { authenticate } from "./middleware/auth.ts";

process.stdout.write("\x1Bc");
process.stdout.write("\x1b]0;⚔️ DS Auth Server\x07");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";

// Guard against runtime failures if the keys are missing
if (!process.env.JWT_SECRET) {
  console.error(
    "⛔ CRITICAL RUNTIME ERROR: process.env.GAME_SECRET is missing from your environment setup!",
  );
  process.exit(1);
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
      };
    }
  }
}

// Universal password validation fallback hash for "password123"
const GLOBAL_MOCK_PASSWORD_HASH =
  "$2b$10$C1cwxtYIkD1pjSOIpB5ZCOa/aeULF82.6reySijT1ZqgWfSC.Z7jK";

app.use(
  cors({
    origin: ["http://localhost:5173", "http://10.0.0.46:5173"],
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.post("/api/authorize-game", authenticate, async (req, res) => {
  const { characterId, playerId } = req.body;
  const secretKey = process.env.GAME_SECRET || "";

  // 2. Generate a "Game Access Ticket" (short-lived JWT)
  const ticket = jwt.sign(
    { playerId, characterId },
    secretKey,
    { expiresIn: "5m" }, // Give yourself a 5-minute buffer for testing!
  );

  res.json({ ticket });
});

/**
 * 🔐 POST /api/login Endpoint
 */
app.post(
  "/api/login",
  async (req: Express.Request, res: Express.Response): Promise<any> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Missing email or security key strings." });
      }

      const targetEmail = email.trim().toLowerCase();
      const matchedPlayer = Array.from(playersData.values()).find(
        (p) => p.email.toLowerCase() === targetEmail,
      );

      if (!matchedPlayer) {
        return res
          .status(401)
          .json({ message: "Invalid credentials provided." });
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        GLOBAL_MOCK_PASSWORD_HASH,
      );

      if (!isPasswordValid) {
        return res
          .status(401)
          .json({ message: "Invalid credentials provided." });
      }

      const associatedCharacters = Array.from(charactersData.values()).filter(
        (char) => char.playerId === matchedPlayer.id,
      );

      const token = jwt.sign(
        {
          playerId: matchedPlayer.id,
          email: matchedPlayer.email,
        },
        JWT_SECRET,
        { expiresIn: "1d" },
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
        path: "/",
      });

      Log.SERVER.INFO(
        `[AUTH] Player ${matchedPlayer.firstName} (ID: ${matchedPlayer.id}) logged in successfully.`,
      );

      return res.status(200).json({
        success: true,
        playerId: matchedPlayer.id,
        characters: associatedCharacters,
      });
    } catch (error) {
      console.error("Auth Server Failure Context:", error);
      return res
        .status(500)
        .json({ message: "Internal server authentication exception." });
    }
  },
);

/**
 * 🚪 POST /api/logout Endpoint
 */
app.post("/api/logout", (req: Express.Request, res: Express.Response) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
  });
  res.status(200).json({
    success: true,
    message: "Logged out from realm session successfully.",
  });
});

app.listen(Number(PORT), "0.0.0.0", () => {
  Log.SERVER.INFO(`⚔️ Auth Server listening on port ${PORT}.`);
});
