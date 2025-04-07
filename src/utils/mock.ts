import { SavedPlayer } from "../lib/types/server";
import { SavedCharacter } from "../lib/types/world";

export const players = [
  { id: 111, email: 'leiaorgana@rebels.org', firstName: 'Leia', lastName: 'Organa' },
  { id: 222, email: 'hansolo@smugglers.org', firstName: 'Han', lastName: 'Solo' }
] as SavedPlayer[]

export const characters = [
  { id: 333, pid: 111, name: 'Leiara', level: 1, health: { max: 2315, hp: 2315 }, x: 2, y: 1, area: { id: 1000 }},
  { id: 444, pid: 222, name: 'Hansor', level: 2, health: { max: 4122, hp: 4122 }, x: 3, y: 1, area: { id: 1000 }},
] as SavedCharacter[]

export const mockFetchPlayerFile = (pid: number): SavedPlayer => players.find(player => player.id === pid);
export const mockFetchCharacter = (cid: number) => characters.find(character => character.id === cid);
export const mockFetchAvailableCharacters = (pid: number) => characters.filter(character => character.pid === pid);