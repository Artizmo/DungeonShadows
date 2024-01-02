import { PlayerType } from './player'

export type ServerType = {
  port: number
  players: Map<Number, PlayerType>
}