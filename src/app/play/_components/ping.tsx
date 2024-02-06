import { useEffect, useState } from 'react'
import { useGame } from '../_context/game-context'
import Game from '@/_classes/Game'

export default function PingNumber() {
  const [ping, setPing] = useState(0)
  const { game }: { game: Game } = useGame()

  useEffect(() => {
    if (!game) return

    game.connection.addEventListener('ping', handleSetPing)

    return () => game.connection.removeEventListener('ping', handleSetPing)
  }, [])

  const handleSetPing = (event: CustomEvent) => {
    const { detail: ping } = event
    setPing(ping)
  }

  return (
    <div>ping: {ping} ms</div>
  )
}