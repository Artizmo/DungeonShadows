export default class Player {
  id = 0
  email = ''
  firstName = ''
  lastName = ''
  token = ''
  ipAddress = ''
  isAlive = false
  connection = null

  constructor(user: any, connection: any, token: string, ipAddress: string, isAlive: boolean) {
    this.id = user.id
    this.email = user.email
    this.firstName = user.firstName
    this.lastName = user.lastName
    this.ipAddress = ipAddress
    this.isAlive = isAlive
    this.connection = connection
    this.token = token
  }
}