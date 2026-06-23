import GameClient from './_components/game-client'

export default function PlayPage({ searchParams }) {
  
  // fetch pid from token here
  // pass pid to gameclient

  const { pid } = searchParams

  return (
    <GameClient pid={JSON.parse(pid)} />
  )
}