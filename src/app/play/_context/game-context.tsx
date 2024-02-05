import { createContext, useContext, useEffect, useState } from 'react'
import Character from '@/_classes/Character'
import Game from '@/_classes/Game'

const GameContext = createContext(null)

export const GameProvider = ({ children, pid }: { children: any, pid: number }) => {
  const [characters, setCharacters] = useState<Character[]>([])
  const [character, setCharacter] = useState<Character>(null)
  const [game, setGame] = useState<Game>(null)

  useEffect(() => {
    const game = new Game()
    setGame(game)

    game.start(pid)
    game.connection.addEventListener('available-characters', handleAvailableCharactersEvent)
    game.connection.addEventListener('character', handleCharacterEvent)

    return () => game.connection.close()
  }, [])

  const handleAvailableCharactersEvent = (event: CustomEvent) => {
    const { detail: characters } = event
    setCharacters(characters)
  }
  
  const handleCharacterEvent = (event: CustomEvent) => {
    const { detail: character } = event
    setCharacter(character)
  }

  return (
    <GameContext.Provider value={{ character, characters, game }}>
      {children}
    </GameContext.Provider>
  )
}

export const useGame = () => {
  const context = useContext(GameContext)
  if (context === undefined) {
    throw new Error('useEditableCharacter must be used within a EditCharacterProvider')
  }

  return context
}