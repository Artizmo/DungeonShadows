import { useEffect } from 'react';

const Game = ({ character }) => {
  useEffect(() => {
    if (character) {
      console.log(`playing DS as ${character}`);
    }
  }, [character])

  return (
    <div>
      <h3>Dungeon Shadows</h3>
      <canvas></canvas>
    </div>
  )
}

export default Game;

