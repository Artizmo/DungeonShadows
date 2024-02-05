import { useEffect, useState } from 'react'
import { useGame } from '../_context/game-context'
import Game from '@/_classes/Game'

export default function Cycle() {
  const [cycle, setCycle] = useState(0)
  const { game }: { game: Game } = useGame()

  useEffect(() => {
    if (!game) return

    game.connection.addEventListener('update', handleUpdateEvent)

    return () => game.connection.removeEventListener('update', handleUpdateEvent)
  }, [])

  const handleUpdateEvent = (event: CustomEvent) => {
    const { detail: { currentCycle } } = event
    setCycle(currentCycle)
  }

  return (
    <div>cycle: {cycle}</div>
  )
}