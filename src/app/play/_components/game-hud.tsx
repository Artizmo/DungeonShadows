import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useGame } from '../_context/game-context'
import Cycle from './cycle'
import HealthBar from './health-bar'
import ManaBar from './mana-bar'
import FPSNumber from './fps'
import PingNumber from './ping'
import Character from '@/_classes/Character'
import Game from '@/_classes/Game'
import MainInput from './main-input'

export default function GameHUD() {
  const [character, setCharacter] = useState<Character>(null)
  const { game }: { game: Game } = useGame()
  const router = useRouter()

  useEffect(() => {
    if (!game) return

    game.connection.addEventListener('character', handleCharacterEvent)

    return () => {
      game.connection.removeEventListener('character', handleCharacterEvent)
    }
  }, [game])

  const handleCharacterEvent = (event: CustomEvent) => setCharacter(event.detail)

  if (!character) return null

  const handleTestClick = () => {
    console.log('clicky')
  }

  const handleLogoutClick = () => {
    game.logout()
    router.push('/login')
  }

  return (
    <div className="flex items-end justify-between absolute z-[1] w-full bottom-0">
      <div className="w-[10rem] h-[10rem] bg-[#ff0000]">map</div>
      <div className="w-[5rem] h-[5rem] bg-[#156dc6]">
        <button className="text-[#ffff00]" onClick={() => handleTestClick()}>[...]</button>
      </div>
      <div className="w-[8rem] h-[8rem] bg-[#6bbd22]">
        {character.name}<br />
        {character.hp}/{character.maxHp}<br />
        {character.x}
      </div>
      <div className="bg-[#962587] flex-1 overflow-hidden">
        <MainInput /> 
        <HealthBar />
        <ManaBar />
      </div>
      <div className="w-[5rem] h-[5rem] bg-[#dcc51a]">filler</div>
      <div className="w-[6rem] h-[6rem] bg-[#23d0d3]">
        <button className="text-[#333333]" onClick={() => handleLogoutClick()}>logout</button>
        <Cycle />
        <FPSNumber />
        <PingNumber />
      </div>
    </div>
  )
}