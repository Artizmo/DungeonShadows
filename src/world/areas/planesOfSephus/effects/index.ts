import { Effect, EffectType } from '~/lib/effects/types';
import { poison } from '~/lib/effects/poison';

export const effectsLibrary: Record<EffectType, Effect> = {
  [EffectType.POISON]: poison
};