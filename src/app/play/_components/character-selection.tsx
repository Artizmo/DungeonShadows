import Character from '@/_classes/Character'
import { useGame } from '../_context/game-context'

export default function CharacterSelection() {
  const { character, characters, game } = useGame()

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