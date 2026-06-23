import { useEffect, useState } from 'react'
import { useGame } from '../_context/game-context'
import Game from '@/_classes/Game'

export default function ManaBar() {
  const { game }: { game: Game } = useGame()
  const { hp = 0, max = 0 } = game?.character?.health ?? {}
  const [health, setHealth] = useState(hp)
  const percent = Math.floor((health / max) * 100)
  
  useEffect(() => {
    if (!game?.character) return

    game.connection.addEventListener('update', handleUpdateEvent)

    return () => game.connection.removeEventListener('update', handleUpdateEvent)
  }, [game])

  const handleUpdateEvent = () => {
    const r = Math.floor(Math.random() * 150) + 1
    if (r === 20) {
      const h = Math.floor(Math.random() * max)
      setHealth(h)
      game.character.setHp = h
    } 
  }
  
  return (
    <div className="relative m-1 border border-solid border-[#222] bg-[#3e3e3e]">
      <div className="w-[100%] h-[100%] absolute z-[1] bg-[radial-gradient(circle,rgba(63,94,251,0)_67%,rgba(0,0,0,.45)_100%)]" />
      <div className="text-shadow absolute flex items-center justify-center inset-0">{health}/{max}</div>
      <div style={{ 'width': `${percent}%` }} className={`h-[1rem] bg-[#142bad] transition-[width] duration-[3s] ease-[ease]`} />
    </div>
  )
}