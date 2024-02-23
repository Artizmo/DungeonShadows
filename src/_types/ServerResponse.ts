type ServerMessage<T> = {
  type: string
  data: T
}

export type ServerResponseHandlers = Map<string, (arg: any) => void>

export type ServerResponse<T> = { 
  message: ServerMessage<T>
  responseHandlers: ServerResponseHandlers
}