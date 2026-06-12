
export default class Npc {
  id: number
  name: string

  constructor(npc: Npc) {
    this.id = npc.id
    this.name = npc.name
  }

  update() {

  }
}