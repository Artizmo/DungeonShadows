import { useEffect, useState } from 'react'
import { useGame } from '../_context/game-context'
import Game from '@/_classes/Game'

type PingTimes = {
  serverTime?: number
  clientTime?: number
  serverAckTime?: number
  clientAckTime?: number
}

export default function PingNumber() {
  const [ping, setPing] = useState(0)
  const { game }: { game: Game } = useGame()

  useEffect(() => {
    if (!game) return

    game.connection.addEventListener('ping-label', handleSetPing)

    return () => game.connection.removeEventListener('ping-label', handleSetPing)
  }, [])

  const handleSetPing = (event: CustomEvent) => {
    const { detail: pingTimes }: { detail: PingTimes } = event
    const { serverTime, clientTime, serverAckTime, clientAckTime } = pingTimes
    const calculatedPing = Math.ceil((serverAckTime - serverTime) - ((clientAckTime - clientTime) * 0.5))
    const ping = calculatedPing > 0 ? calculatedPing : 1
    setPing(ping)
  }

  return (
    <div className="text-[.75rem]">ping: <span className="font-bold">{ping}</span> ms</div>
  )
}