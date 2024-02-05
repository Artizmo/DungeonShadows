import { useGame } from '../_context/game-context'

export default function GameScreen() {
  const { character } = useGame()

  if (!character) return null

  return (
    <main className="bg-[#09111ddb] flex-1">
      <div className="w-full p-4 absolute z-[1]">
        <canvas className="w-full h-[75vh] bg-[#22222276] relative" />
      </div>
      <canvas id="bgMap" className="w-full h-[100vh] absolute" />
    </main>
  )
}