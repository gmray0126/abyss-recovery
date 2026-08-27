export const TICK_RATE = 20;
export const TICK_DT = 1 / TICK_RATE;

export function emptyInput(){
  return {seq:0,moveX:0,moveY:0,aimX:1,aimY:0,shoot:false,reload:false,sprint:false,interact:false,useMed:false};
}

export const ACTIONS = Object.freeze({
  LOOT:'loot', EQUIP:'equip', CLOSE_CONTAINER:'close-container'
});
