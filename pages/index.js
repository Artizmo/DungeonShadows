import Head from 'next/head';
import MainScreen from '/screens/main';

export default function Home() {
  return (
    <div>
      <Head>
        <title>Dungeon Shadows</title>
        <meta name="description" content="Welcome to Dungeon Shadows" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <MainScreen />
    </div>
  )
}
