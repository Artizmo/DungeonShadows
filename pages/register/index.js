import Head from 'next/head';
import Registration from '/screens/register';

const Register = () => {
  return (
    <div>
      <Head>
        <title>Dungeon Shadows</title>
        <meta name="description" content="Welcome to Dungeon Shadows" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Registration />
    </div>
  )
}

export default Register