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
  const [ping, setPing] = useState(null)
  const { game }: { game: Game } = useGame()

  useEffect(() => {
    if (!game) return

    game.connection.addEventListener('ping-label', handleSetPing)

    return () => game.connection.removeEventListener('ping-label', handleSetPing)
  }, [])

  const calculatePing = (pingTimes: PingTimes) => {
    const MAX_PING = 5000
    const MIN_PING = 1
    const { serverTime, clientTime, serverAckTime, clientAckTime } = pingTimes
    const calculatedPing = Math.ceil((serverAckTime - serverTime) - ((clientAckTime - clientTime) * 0.5))

    if (calculatedPing > MAX_PING) return false
    if (calculatedPing <= 0) return MIN_PING

    return calculatedPing
  }

  const handleSetPing = (event: CustomEvent) => {
    const ping = calculatePing(event.detail)
    if (!ping) return

    setPing(ping)
  }

  return (
    <div className="text-[.75rem]">ping: <span className="font-bold">{ping}</span> ms</div>
  )
}