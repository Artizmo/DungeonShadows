// import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useGame } from '../_context/game-context'
import Character from '@/_classes/Character'
import Game from '@/_classes/Game'

let mapChunks: Buffer[] = []

export default function GameScreen() {
  const [character, setCharacter] = useState<Character>(null)
  const { game }: { game: Game } = useGame()
  const mapRef = useCallback((canvasEl: HTMLCanvasElement) => {
    game.renderer.setCanvas('map', canvasEl)
  }, [game])
  const tilesRef = useCallback((canvasEl: HTMLCanvasElement) => {
    game.renderer.setCanvas('tiles', canvasEl)
  }, [game])

  useEffect(() => {
    if (!game) return

    game.connection.addEventListener('character', handleCharacterEvent)
    game.connection.addEventListener('map', handleMapEvent)

    return () => {
      game.connection.removeEventListener('character', handleCharacterEvent)
    }
  }, [game])

  const handleCharacterEvent = (event: CustomEvent) => setCharacter(event.detail)

  const handleMapEvent = (event: CustomEvent) => {
    const chunk = event.detail

    mapChunks.push(chunk)
    // const t = document.getElementById('test') as HTMLImageElement
    // t.setAttribute('src', 'data:image/jpeg;base64,' + btoa(mapChunks.join('')))
    
    // console.log('bingo canvas', game.renderer.canvases.get('map'))
    game.renderer.drawMap(mapChunks)
  }

  if (!character) return null

  return (
    <main className="bg-[#130e0cdb] flex-1">
      <div className="w-full p-4 absolute z-[2]">
        <canvas ref={tilesRef} className="w-full h-[75vh] relative" />
      </div>
      <div className="w-full p-4 absolute z-[1]">
        {/* <img id="test" src="" alt="" /> */}
        <canvas ref={mapRef} className="w-full h-[75vh] relative" />
      </div>
      <canvas id="bgMap" className="w-full h-[100vh] absolute inset-0" />
    </main>
  )
}