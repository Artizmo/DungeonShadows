import { useState } from 'react';
import { useRouter } from 'next/router'
import styles from './mainScreen.module.scss';

const MainScreen = () => {
  const [email, emailSet] = useState('bezedulce@gmail.com');
  const [password, passwordSet] = useState('Gamer123!');
  const router = useRouter();

  const handleSubmit = async () => {
    const isAuthed = await fetch('api/login').then(response => response.json());
    if (isAuthed) {
      router.push('/play')
    }
  }

  return (
    <div className={styles.login}>
      <h2>Welcome to Dungeon Shadows</h2>
      <div className={styles.login_container}>
        <h5>Account login</h5>
        <input 
          className={styles.login_field_value} 
          onChange={event => emailSet(event.target.value)}
          placeholder="email" 
          type="text" 
          value={email}
        />
        <input 
          className={styles.login_field_value}
          onChange={event => passwordSet(event.target.value)}
          placeholder="password" 
          type="password" 
          value={password} 
         />
        <button onClick={handleSubmit} className={styles.login_button}>Sign in</button>
        <a href="/register">Create an account</a>
      </div>
    </div>
  )
}

export default MainScreen;