'use client'

import Image from "next/image"
import { useEffect } from 'react'


export default function GameCanvas() {
  useEffect(() => {
    const gameServer = new WebSocket(`ws://localhost:8000`)
    console.log('bingo', 123)
    gameServer.onopen = () => {
      const obj = { email: 'hansolo@smugglers.org', firstName: 'Han', lastName: 'Solo' }
      gameServer.send(JSON.stringify({ type: 'signon', data: obj }))
    }
  }, [])

  return (
    <div className="flex flex-col flex-1 bg-[#222]">
      <canvas className="w-full h-[70vh] bg-[#444]" />
      <div className="flex">
        <div>Canvas page</div>
        <Image 
          alt=""
          className="m-1 object-contain"
          src="/logo.webp"
          width="16"
          height="16"
        />
      </div>
    </div>
  )
}