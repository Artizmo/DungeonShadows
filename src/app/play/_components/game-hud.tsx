import { useRouter } from 'next/navigation'
import { useGame } from '../_context/game-context'
import Cycle from './cycle'
import HealthBar from './health-bar'
import ManaBar from './mana-bar'
import { useEffect } from 'react'
import FPSNumber from './fps'

export default function GameHUD() {
  const { character, game } = useGame()
  const router = useRouter()

  useEffect(() => {
    console.log('render check HUD', character, game)
  })

  if (!character) return null

  const handleTestClick = () => {
    console.log('clicky')
  }

  const handleLogoutClick = () => {
    game.logout()
    router.push('/login')
  }

  console.log('render check')

  return (
    <div className="flex items-end justify-between absolute z-[1] w-full bottom-0">
      <div className="w-[10rem] h-[10rem] bg-[#ff0000]">map</div>
      <div className="w-[5rem] h-[5rem] bg-[#156dc6]">
        <button className="text-[#ffff00]" onClick={() => handleTestClick()}>[...]</button>
      </div>
      <div className="w-[8rem] h-[8rem] bg-[#6bbd22]">
        {character.name}<br />
        {character.hp}/{character.maxHp}
      </div>
      <div className="h-[3rem] bg-[#962587] flex-1 overflow-hidden">
        <HealthBar />
        <ManaBar />
      </div>
      <div className="w-[5rem] h-[5rem] bg-[#dcc51a]">filler</div>
      <div className="w-[6rem] h-[6rem] bg-[#23d0d3]">
        <div>menu</div>
        <button className="text-[#ffff00]" onClick={() => handleLogoutClick()}>logout</button>
        <Cycle />
        <FPSNumber />
      </div>
    </div>
  )
}