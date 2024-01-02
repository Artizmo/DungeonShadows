import { ServerType } from './server'

export type ServerEntityType = {
  server: ServerType,
  update: (pulse?: boolean) => void,
  draw: () => void
}