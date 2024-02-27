export default class InputController {
  input: (type: string) => void

  constructor(input: (type: string) => void) {
    this.input = input

    addEventListener('keydown', event => this.inputEventKeys(event, 'keydown'))
    addEventListener('keyup', event => this.inputEventKeys(event, 'keyup'))
  }

  inputEventKeys(event: KeyboardEvent, keyDir: string) {
    if (event.key === 'w') this.input(`move-up-${keyDir}`)
    if (event.key === 's') this.input(`move-down-${keyDir}`)
    if (event.key === 'a') this.input(`move-left-${keyDir}`)
    if (event.key === 'd') this.input(`move-right-${keyDir}`)
  }
}