import { useState } from 'react';
import Head from 'next/head';
import CharacterList from '/screens/characterList';
import Game from '/screens/game';

const useSession = () => ({});

const Play = () => {
  const session = useSession(); 
  const [character, characterSet] = useState(null);

//   const handlePlay = () => isPlayingSet(true);
// console.log('char', session, character, isPlaying)
  return (
    <div>
      <Head>
        <title>Dungeon Shadows</title>
        <meta name="description" content="Welcome to Dungeon Shadows" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {session && !character && (
        <div>
          <CharacterList onSelect={characterSet} />
        </div>
      )}
      {session && character && (
        <Game character={character} />
      )}
    </div>
  )
}

export default Play;