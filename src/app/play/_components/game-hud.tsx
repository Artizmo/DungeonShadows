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
  const { game }: { game: Game } = useGame()
  const [character, setCharacter] = useState<Character>(null)
  const router = useRouter()

  useEffect(() => {
    if (!game) return

    game.connection.addEventListener('update', handleCharacterEvent)

    return () => {
      game.connection.removeEventListener('update', handleCharacterEvent)
    }
  }, [game])

  const handleCharacterEvent = (event: CustomEvent) => {
    const { character } = event.detail
    if (!character) return
    setCharacter({ ...character })
  }

  const handleTestClick = () => {
    console.log('clicky')
  }
  
  const handleLogoutClick = () => {
    game.logout()
    router.push('/login')
  }
  
  if (!character) return null

  return (
    <div className="flex items-end justify-between absolute z-[1] w-full bottom-0">
      <div className="w-[10rem] h-[10rem] bg-[#ff0000]">map</div>
      <div className="w-[5rem] h-[5rem] bg-[#156dc6]">
        <button className="text-[#ffff00]" onClick={() => handleTestClick()}>[...]</button>
      </div>
      <div className="w-[8rem] h-[8rem] bg-[#6bbd22]">
        {character.name}<br />
        {character.health?.hp}/{character.health?.max}<br />
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