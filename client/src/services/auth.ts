import { AUTH_API_URL } from "~/core/utils/constants";

export const fetchGameTicket = async (
  characterId: number,
  playerId: number,
): Promise<string | null> => {
  try {
    const response = await fetch(`${AUTH_API_URL}/api/authorize-game`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ characterId, playerId }),
      credentials: "include",
    });

    if (!response.ok) throw new Error(`Auth Server status: ${response.status}`);
    const data = await response.json();
    return data.ticket;
  } catch (error) {
    console.error("Failed to fetch game access ticket:", error);
    return null;
  }
};

export function decodeTicket(
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
