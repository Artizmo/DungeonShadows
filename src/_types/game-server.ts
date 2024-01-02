import { PlayerType } from '../_types/player'

export type GameServerType = {
  port: number
  players: Map<Number, PlayerType>
}