type ServerMessage<T> = {
  type: string
  data: T
}

export type ServerResponseHandlerType = (arg: any) => void

export type ServerResponseHandlers = Map<string, ServerResponseHandlerType>

export type ServerResponseType<T> = { 
  message: ServerMessage<T>
  responseHandlers: ServerResponseHandlers
}