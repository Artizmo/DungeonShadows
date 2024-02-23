import { useCallback, useEffect, useState } from 'react'
import { useGame } from '../_context/game-context'
import Character from '@/_classes/Character'
import Game from '@/_classes/Game'

export default function GameScreen() {
  const [character, setCharacter] = useState<Character>(null)
  const { game }: { game: Game } = useGame()

  useEffect(() => {
    if (!game) return

    game.connection.addEventListener('character', handleCharacterEvent)

    return () => {
      game.connection.removeEventListener('character', handleCharacterEvent)
    }
  }, [game])
  
  const tileMapRef = useCallback((canvasEl: HTMLCanvasElement) => {
    game.renderer.setMap('tiles', canvasEl)
  }, [game])

  const handleCharacterEvent = (event: CustomEvent) => setCharacter(event.detail)

  if (!character) return null

  return (
    <main className="bg-[#130e0cdb] flex-1">
      <div className="w-full p-4 absolute z-[1]">
        <canvas ref={tileMapRef} className="w-full h-[75vh] bg-[#22222276] relative" />
      </div>
      <canvas id="bgMap" className="w-full h-[100vh] absolute inset-0" />
    </main>
  )
}