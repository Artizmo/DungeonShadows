export default class Item {
  id: number
  name: string

  constructor(item: Item) {
    this.id = item.id
    this.name = item.name
  }
}