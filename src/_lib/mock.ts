import { SavedCharacter } from '../_types/SavedCharacter'
import { SavedPlayer } from '../_types/SavedPlayer'

export const players = [
  { id: 111, email: 'leiaorgana@rebels.org', firstName: 'Leia', lastName: 'Organa' },
  { id: 222, email: 'hansolo@smugglers.org', firstName: 'Han', lastName: 'Solo' }
] as SavedPlayer[]

export const characters = [
  { id: 333, pid: 111, name: 'Leiara', level: 1, health: { max: 2315, hp: 2315 }, x: 2, y: 1, area: { id: 1000 }},
  { id: 444, pid: 222, name: 'Hansor', level: 2, health: { max: 4122, hp: 4122 }, x: 3, y: 1, area: { id: 1000 }},
] as SavedCharacter[]