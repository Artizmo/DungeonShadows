import { GameEventType, type GameEvent, type PendingEvent } from '~/@types/events';
import type World from "~/core/World";
import type Character from "~/core/Character";
import { sleepEvent } from '~/lib/events/sleep';
import { drinkEvent } from '~/lib/events/drink';
import Log from './Logger';

export default class EventsManager {
  private static registry: Map<string, GameEvent> = new Map([
    [GameEventType.SLEEP, sleepEvent],
    [GameEventType.DRINK, drinkEvent]
  ]);

  public static tick(character: Character, tick: number, world: World): void {
    if (!character.hasPendingEvents) return;

    const eventsToProcess = [...character.pendingEvents];

    character.pendingEvents = character.pendingEvents.filter(
      event => !eventsToProcess.includes(event)
    );

    for (const pendingEvent of eventsToProcess) {
      const event = this.registry.get(pendingEvent.type);

      if (!event) {
        Log.CHAR.INFO(`Unknown event script: ${pendingEvent.type}`);
        continue;
      }

      try {
        event.tick({
          character,
          world,
          tick,
          pendingEvent
        });
      } catch (e) {
        Log.CHAR.ERROR(`Unknown event script: ${pendingEvent.type}`);
      }
    }
  }

  public static addEvent(character: Character, pendingEvent: PendingEvent): void {
    const event = this.registry.get(pendingEvent.type);

    if (!event) {
      Log.CHAR.ERROR(`Unknown event script: ${pendingEvent.type}`);
      return;
    }

    character.pendingEvents.push(pendingEvent);
    Log.CHAR.INFO(`Queued ${pendingEvent.type} event for ${character.name}.`);
  }
}