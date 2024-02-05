import { useEffect, useState } from 'react'
import { useGame } from '../_context/game-context'
import Game from '@/_classes/Game'
import Character from '@/_classes/Character'

export default function HealthBar() {
  const { character, game }: { character: Character, game: Game } = useGame()
  const [health, setHealth] = useState(character.hp)
  const { maxHp } = character
  const percent = Math.floor((health / maxHp) * 100)

  useEffect(() => {
    if (!game) return

    game.connection.addEventListener('update', handleUpdateEvent)

    return () => game.connection.removeEventListener('update', handleUpdateEvent)
  }, [])

  const handleUpdateEvent = () => {
    const r = Math.floor(Math.random() * 150) + 1
    if (r === 20) {
      const h = Math.floor(Math.random() * maxHp)
      setHealth(h)
    } 
  }
  
  return (
    <div className="relative m-1 border border-solid border-[#222] bg-[#3e3e3e]">
      <div className="w-[100%] h-[100%] absolute z-[1] bg-[radial-gradient(circle,rgba(63,94,251,0)_67%,rgba(0,0,0,.45)_100%)]" />
      <div className="text-shadow absolute flex items-center justify-center inset-0">{health}/{maxHp}</div>
      <div style={{ 'width': `${percent}%` }} className={`h-[1rem] bg-[#14ad30] transition-[width] duration-[3s] ease-[ease]`} />
    </div>
  )
}