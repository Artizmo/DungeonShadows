import styles from './characterList.module.scss';

const CharacterList = ({ onSelect }) => {
  return (
    <div className={styles.character_selection}>
      <h2>Character Selection</h2>
      <div className={styles.form_container}>
        <select onChange={event => onSelect(event.target.value)} className={styles.form_field_value}>
          <option value="null">Select your character</option>
          <option value="brytagg">Brytagg</option>
          <option value="androse">Androse</option>
        </select>
        <a href="/">Back to main</a>
      </div>
    </div>
  )
}

export default CharacterList;

