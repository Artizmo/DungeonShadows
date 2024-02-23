import Character from '@/_classes/Character'
import { useGame } from '../_context/game-context'
import { useEffect, useState } from 'react'
import Game from '@/_classes/Game'

export default function CharacterSelection() {
  const [character, setCharacter] = useState<Character>(null)
  const [characters, setCharacters] = useState<Character[]>([])
  const { game }: { game: Game } = useGame()

  useEffect(() => {
    if (!game) return

    game.connection.addEventListener('available-characters', handleAvailableCharacterEvent)
    game.connection.addEventListener('character', handleCharacterEvent)

    return () => {
      game.connection.removeEventListener('available-characters', handleAvailableCharacterEvent)
      game.connection.removeEventListener('character', handleCharacterEvent)
    }
  }, [game])

  const handleCharacterEvent = (event: CustomEvent) => setCharacter(event.detail)

  const handleAvailableCharacterEvent = (event: CustomEvent) => setCharacters(event.detail)

  const handleCharacterSelect = (cid: number) => {
    game.join(cid)
  }

  if (character) return null

  return (
    <main>
      <div>char selection</div>
      <>
        {!characters.length && <div>no characters.</div>}
        {characters.map((c: Character) => (
          <button 
            key={c.id}
            className="text-[#0000ff] bg-[#777] my-1 px-2 m-1" 
            onClick={() => handleCharacterSelect(c.id)}>
            {c.name}
          </button>
        ))}
      </>
    </main>
  )
}