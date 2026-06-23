export type SavedCharacter = {
  id: number
  pid: number
  name: string
  level: number
  health: {
    hp: number
    max: number
  }
  x: number
  y: number
  area: {
    id: string
  }
}