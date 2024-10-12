import type Area from '../_classes/Area'

export type SavedWorld = {
  name: string
  areas: Map<number, Area>
}