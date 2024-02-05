import InputController from './InputController'

export default class KeyboardMouseController {
  
  constructor() {

    this.init()
  }

  init() {
    window.addEventListener('keypress', event => {
      console.log('bingo keypress', event)
    })
  }
}