'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
  const [pid, setPid] = useState('')
  const router = useRouter()

  return (
    <div>
      <div>mock login</div>
      <input className="border-[1px] border-[#777]" type="text" value={pid} onChange={event => setPid(event.target.value)} />
      <button onClick={() => router.push(`/play?pid=${pid}`)}>connect</button>
    </div>
  )
}