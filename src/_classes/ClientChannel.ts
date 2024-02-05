type Event = {
  type: string,
  callback: (arg: any) => void
}

type EventTypes = 'available-characters'

let instance: ClientChannel = null

class ClientChannel {
  subscribers: Map<string, Event>

  constructor() {
    if (instance) {
      throw new Error('Instance already exists.')
    }

    this.subscribers = new Map()

    instance = this
  }

  subscribe<T>(type: EventTypes, callback: (arg: T | null) => void) {
    this.subscribers.set(type, { type, callback })
  }

  subscribeList(eventList: Event[]) {
    for (const event of eventList) {
      const { type } = event
      this.subscribers.set(type, event)
    }
  }

  publish<T>(type: string, payload?: T) {
    this.subscribers.forEach(subscriber => {
      if (subscriber.type !== type) return

      subscriber.callback(payload)
    })
  }

  unsubscribe(event: EventTypes) {
    this.subscribers.delete(event)
  }
}

instance = new ClientChannel()

export default instance