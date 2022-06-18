import styles from './register.module.scss';

const Registration = () => {
  return (
    <div className={styles.register}>
      <h2>Please complete the new account form</h2>
      <div className={styles.form_container}>
        <h5>New Account</h5>
        <input type="text" placeholder="email" className={styles.form_field_value} />
        <input type="password" placeholder="password" className={styles.form_field_value} />
        <input type="password" placeholder="confirm password" className={styles.form_field_value} />
        <button className={styles.form_button}>Create account</button>
        <a href="/">Back to main</a>
      </div>
    </div>
  )
}

export default Registration;