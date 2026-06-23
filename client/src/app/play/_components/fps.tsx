import { useEffect, useState } from 'react'
import { useGame } from '../_context/game-context'
import Game from '@/_classes/Game'

export default function FPSNumber() {
  const [fps, setFps] = useState(0)
  const { game }: { game: Game } = useGame()

  useEffect(() => {
    if (!game) return

    game.connection.addEventListener('update', handleUpdateEvent)

    return () => game.connection.removeEventListener('update', handleUpdateEvent)
  }, [])

  const handleUpdateEvent = (event: CustomEvent) => {
    const { detail: { fps } } = event
    setFps(fps)
  }

  return (
    <div className="text-[.75rem]">FPS: <span className="font-bold">{fps}</span></div>
  )
}