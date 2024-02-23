import { createContext, useContext, useEffect, useState } from 'react'
import Game from '@/_classes/Game'

const GameContext = createContext(null)

export const GameProvider = ({ children, pid }: { children: any, pid: number }) => {
  const [game, setGame] = useState<Game>(null)

  useEffect(() => {
    const game = new Game()
    setGame(game)

    game.start(pid)
  }, [pid])

  return (
    <GameContext.Provider value={{ game }}>
      {children}
    </GameContext.Provider>
  )
}

export const useGame = () => {
  const context = useContext(GameContext)
  if (context === undefined) {
    throw new Error('useGame must be used within the GameProvider')
  }

  return context
}