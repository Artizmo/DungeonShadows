// import { Effect, EffectType } from '~/lib/effects/types';
// import Log from '~/core/Logger';

// export const coughOfTheCrone: Effect = {
//   name: "Cough of the Crone",
//   type: EffectType.CUSTOM,
//   duration: 150,
//   density: 4,
//   interval: 6,
//   applyMessage: "A dusty, ancient spore fills your lungs and locks your chest!",
//   resolveMessage: "Your lungs finally clear as the crone's curse fades away.",

//   tick({ character, activeEffect }) {
//     if (character.isDead) return;

//     // Custom Mechanic: Drains 8 Mana instead of Health!
//     if (activeEffect.duration % activeEffect.interval === 0) {
//       character.stats.hp = Math.max(0, character.stats.hp - 8);
//       Log.CHAR.INFO(`${character.name} coughs violently and loses 8 Mana.`);
//     }
//   }
// };