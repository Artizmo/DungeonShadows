export type PingTimes = {
  serverTime?: number
  clientTime?: number
  serverAckTime?: number
  clientAckTime?: number
}

export type SavedPlayer = {
  id: number
  email: string
  firstName: string
  lastName: string
}

export type CharacterSelection = {
  pid?: number
  cid?: number
}