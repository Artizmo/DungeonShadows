import { SyntheticEvent, useEffect, useRef, useState } from 'react'
import { useGame } from '../_context/game-context'
import Game from '@/_classes/Game'

export default function MainInput() {
  const { game }: { game: Game } = useGame()
  const [text, setText] = useState('')
  const [inputs, setInputs] = useState([])
  const textRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!game) return

    game.connection.addEventListener('chat', handleChatEvent)

    return () => game.connection.removeEventListener('chat', handleChatEvent)
  }, [game])

  useEffect(() => {
    inputRef.current.scrollTo(0, inputRef.current.scrollHeight)
  }, [inputs])

  const handleOnSubmit = (event: SyntheticEvent) => {
    event.preventDefault()
    
    textRef.current.select()
    
    if (text === 'clear') return setInputs([])

    game.command(text)
  }

  const handleChatEvent = (chat: CustomEvent) => {
    const text = chat.detail

    if (inputs.length > 100) {
      const [_, ...rest] = inputs
      return setInputs([...rest, text])
    }

    setInputs((inputs) => [...inputs, text])
  }

  return (
    <div className="bg-[#e4d89a] flex-col flex justify-end">
      <ul ref={inputRef} className="h-[6rem] flex flex-col overflow-auto">
        {inputs.map((input, i) => (
          <li className="h-fit first:mt-auto" key={i}>{input}</li>
        ))}
      </ul>
      <form onSubmit={handleOnSubmit}>
        <input ref={textRef} className="w-full outline-none" type="text" value={text} onChange={event => setText(event.target.value)} />
      </form>
    </div>
  )
}