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
