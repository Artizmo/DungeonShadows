export default class InputController {
  input: (type: string) => void

  constructor(input: (type: string) => void) {
    this.input = input
    this.init()
  }

  init() {
    window.addEventListener('keydown', event => {
      if (event.key === 'a') {
        this.input('move-left')
      }
      if (event.key === 'd') {
        this.input('move-right')
      }
    })
  }
}