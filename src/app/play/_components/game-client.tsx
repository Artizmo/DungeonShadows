'use client'

import { GameProvider } from '../_context/game-context'
import CharacterSelection from './character-selection'
import GameHUD from './game-hud'
import GameScreen from './game-screen'

export default function GameClient({ pid }: { pid: number }) {
  return (
    <GameProvider pid={pid}>
      <CharacterSelection />
      <GameScreen />
      <GameHUD />
    </GameProvider>
  )
}