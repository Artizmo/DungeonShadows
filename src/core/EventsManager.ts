import { GameEventType, type GameEvent, type PendingEvent } from '~/@types/events';
import type World from "~/core/World";
import type Character from "~/core/Character";
import { sleepEvent } from '~/lib/events/sleep';
import { drinkEvent } from '~/lib/events/drink';

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
        character.logger.error(`Unknown event script: ${pendingEvent.type}`);
        continue;
      }

      event.tick({
        character,
        world,
        tick,
        event: pendingEvent
      });
    }
  }

  public static add(character: Character, pendingEvent: PendingEvent): void {
    const event = this.registry.get(pendingEvent.type);

    if (!event) {
      character.logger.error(`Unknown event script: ${pendingEvent.type}`);
      return;
    }

    character.pendingEvents.push(pendingEvent);
    character.logger.info(`Queued ${pendingEvent.type} event for ${character.name}.`);
  }
}