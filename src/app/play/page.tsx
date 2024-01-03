import GameCanvas from '@/app/play/_components/game-canvas'

export default function PlayPage() {
  console.log('bingo render')
  return (
    <div className="flex">
      <GameCanvas />
    </div>
  )
}