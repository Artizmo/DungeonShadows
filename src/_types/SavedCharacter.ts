export type SavedCharacter = {
  id: number
  pid: number
  name: string
  level: number
  health: {
    hp: number
    max: number
  }
  area: {
    id: string
    x: number
    y: number
  }
}