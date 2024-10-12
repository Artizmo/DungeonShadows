export const INPUT_TYPES = {
  MOVE_NORTH: 'MOVE_NORTH',
  MOVE_EAST: 'MOVE_EAST',
  MOVE_SOUTH: 'MOVE_SOUTH',
  MOVE_WEST: 'MOVE_WEST'
}

type InputType = {
  type: string
  input: any
}

export default class InputController {
  input: (type: InputType) => void
  inputInterval: NodeJS.Timeout = null

  constructor(input: (arg: any) => void) {
    this.input = input

    addEventListener('keydown', event => this.handleKeyDown(event))
    addEventListener('keyup', event => this.handleKeyUp(event))
  }

  handleKeyDown(event: KeyboardEvent) {
    clearInterval(this.inputInterval)
    this.inputInterval = null
    if (this.inputInterval) return

    this.inputInterval = setInterval(() => this.inputEventKeys(event, true))
  }

  handleKeyUp(event: KeyboardEvent) {
    clearInterval(this.inputInterval)
    this.inputInterval = null
    this.inputEventKeys(event)
  }


  inputEventKeys(event: KeyboardEvent, keyDown: boolean = false) {
    const dir = this.getKeyType(event.key)
    const input = { type: 'MOVE', input: { dir, keyDown }}
    this.input(input)
  }

  getKeyType(eventKey: string) {
    if (eventKey === 'w') return INPUT_TYPES.MOVE_NORTH
    if (eventKey === 's') return INPUT_TYPES.MOVE_SOUTH
    if (eventKey === 'a') return INPUT_TYPES.MOVE_WEST
    if (eventKey === 'd') return INPUT_TYPES.MOVE_EAST
  }
}