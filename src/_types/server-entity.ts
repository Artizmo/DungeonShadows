import { GameServerType } from '../_types/game-server'

export type ServerEntityType = {
  server: GameServerType,
  update: (pulse?: boolean) => void,
  draw: () => void
}