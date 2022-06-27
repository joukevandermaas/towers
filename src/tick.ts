import { gridBoundToView, pointInRect } from "./helpers";
import { ViewState } from "./view";

const activeTowerDelayMin = 30;
const activeTowerDelayMax = 40;
const inactiveTowerDelay = 50;

const threshold1 = 10;
const threshold2 = 30;

export type TowerType = "regular" | "attack" | "defense";
export type Team = "red" | "blue" | "purple" | "none";

export interface Tower {
  x: number;
  y: number;
  type: TowerType;

  team: Team;

  value: number;
  maxValue: number;

  targets: Target[];

  ticksSinceUpdate: number;

  nextPassThroughTarget: number;
}

export interface Target {
  index: number;
  ticksSinceUpdate: number;
}

interface Soldier {
  x: number;
  y: number;
  team: Team;

  originalSource: number;
  source: number;
  target: number;

  defPower: number;
  attPower: number;

  dx: number;
  dy: number;
}

export interface GameState {
  gridWidth: number;
  gridHeight: number;

  towers: Tower[];

  soldiers: Soldier[];

  hovered: number | null;
  active: number | null;
}

export const DefaultGameState: GameState = {
  gridWidth: 20,
  gridHeight: 10,

  towers: [
    createTower({
      x: 1,
      y: 1,
      value: 65,
      type: "regular",
      team: "blue",
    }),
    createTower({
      x: 10,
      y: 6,
      value: 65,
      type: "defense",
      team: "blue",
    }),
    createTower({
      x: 15,
      y: 4,
      value: 65,
      type: "attack",
      team: "blue",
    }),
  ],

  soldiers: [],

  hovered: null,
  active: null,
};

export function createTower(
  options: Partial<Tower> & { x: number; y: number }
): Tower {
  return {
    x: options.x,
    y: options.y,
    maxValue: options.maxValue ?? 65,
    targets: options.targets ?? [],
    team: options.team ?? "none",
    type: options.type ?? "regular",
    value: options.value ?? 10,
    ticksSinceUpdate: 0,
    nextPassThroughTarget: 0,
  };
}

export function createTarget(index: number): Target {
  return {
    index,
    ticksSinceUpdate: 50,
  };
}

export function createSoldier(
  state: GameState,
  sourceIndex: number,
  targetIndex: number,
  originalSource?: number
): Soldier {
  let source = state.towers[sourceIndex];
  let target = state.towers[targetIndex];

  let { x: sx, y: sy } = source;
  let { x: tx, y: ty } = target;

  let dx = tx - sx;
  let dy = ty - sy;

  let m = Math.sqrt(dx ** 2 + dy ** 2) * 10;

  return {
    source: sourceIndex,
    target: targetIndex,
    team: source.team,
    originalSource: originalSource ?? sourceIndex,
    x: source.x,
    y: source.y,
    attPower: getAttackPower(source),
    defPower: getDefensePower(source),
    dx: dx / m,
    dy: dy / m,
  };
}

function getAttackPower(tower: Tower) {
  return tower.type === "attack" ? 2 : 1;
}
function getDefensePower(tower: Tower) {
  return tower.type === "defense" ? 2 : 1;
}
function getMaxTargets(tower: Tower) {
  if (tower.value >= threshold2) {
    return 3;
  } else if (tower.value >= threshold1) {
    return 2;
  }
  return 1;
}

function hasPassed(
  dx: number,
  dy: number,
  sx: number,
  sy: number,
  tx: number,
  ty: number
) {
  let reachedX = (dx >= 0 && sx >= tx) || (dx < 0 && sx <= tx);
  let reachedY = (dy >= 0 && sy >= ty) || (dy < 0 && sy <= ty);

  return reachedX && reachedY;
}

function targetIndexOf(targets: Target[], index: number): number {
  for (let i = 0; i < targets.length; i++) {
    if (targets[i].index === index) {
      return i;
    }
  }

  return -1;
}

function createTargetConnection(
  state: GameState,
  sourceIndex: number,
  targetIndex: number
): void {
  let source = state.towers[sourceIndex];
  let target = state.towers[targetIndex];

  if (source.targets.length >= getMaxTargets(source)) {
    // at max targets, can't add more
    return;
  }

  let existingIndex = targetIndexOf(source.targets, targetIndex);
  if (existingIndex !== -1) {
    // connection already exists, remove it
    source.targets.splice(existingIndex, 1);
    return;
  }

  // ok we can add the new connection source->target
  source.targets.push(createTarget(targetIndex));

  // if both towers are on the same team and target was already
  // targeting source, we need to remove that connection

  if (source.team === target.team) {
    let newTargets: Target[] = [];

    for (let j = 0; j < target.targets.length; j++) {
      let t = target.targets[j];

      if (t.index === sourceIndex) {
        // we targeted a tower on our team that is already targeting us
        // so we skip this one (effectively removing it)
        continue;
      }

      newTargets.push(t);
    }

    target.targets = newTargets;
  }
}

export const tick = (state: GameState, view: ViewState): GameState => {
  let s: GameState = structuredClone(state);

  // tick soldiers
  let newSoldiers = [];
  for (let i = 0; i < s.soldiers.length; i++) {
    let soldier = s.soldiers[i];

    if (soldier.defPower === 0 || soldier.attPower === 0) {
      // we died in a clash with another soldier
      continue;
    }

    let target = s.towers[soldier.target];
    let { x: tx, y: ty } = target;

    soldier.x += soldier.dx;
    soldier.y += soldier.dy;

    let perished = false;
    for (let j = 0; j < s.soldiers.length; j++) {
      if (i === j) {
        continue;
      }

      let other = s.soldiers[j];
      if (soldier.target !== other.source) {
        continue;
      }

      if (soldier.team === other.team) {
        continue;
      }

      // collision with other soldiers
      if (
        hasPassed(
          soldier.dx,
          soldier.dy,
          soldier.x,
          soldier.y,
          other.x,
          other.y
        )
      ) {
        let { attPower: sap, defPower: sdp } = soldier;
        let { attPower: tap, defPower: tdp } = other;

        if (sap > tdp) {
          other.attPower = 0;
          other.defPower = 0;

          soldier.attPower -= tdp;
        } else {
          other.attPower -= sdp;
          perished = true;
        }
      }
    }

    if (perished) {
      continue;
    }

    // collision with towers
    if (hasPassed(soldier.dx, soldier.dy, soldier.x, soldier.y, tx, ty)) {
      if (target.team === soldier.team) {
        if (target.value === target.maxValue && target.targets.length) {
          if (soldier.originalSource !== soldier.target) {
            let soldierTarget =
              (target.nextPassThroughTarget + 1) % target.targets.length;
            newSoldiers.push(
              createSoldier(
                s,
                soldier.target,
                target.targets[soldierTarget].index,
                soldier.originalSource
              )
            );
            target.nextPassThroughTarget = soldierTarget;
          }
        } else {
          target.value += soldier.defPower;
        }
      } else {
        target.value -= soldier.attPower;

        if (target.value < 0) {
          target.team = soldier.team;
          target.value = 0;
          target.targets = [];
        }
      }
    } else {
      newSoldiers.push(soldier);
    }
  }

  s.soldiers = newSoldiers;

  // tick towers
  s.hovered = null;

  let clickedTower = false;
  for (let i = 0; i < s.towers.length; i++) {
    let tower = s.towers[i];

    // check if hovered
    if (
      pointInRect(
        view.gridMousePosX,
        view.gridMousePosY,
        tower.x,
        tower.y,
        tower.x + 1,
        tower.y + 1
      )
    ) {
      s.hovered = i;
    }

    // handle click
    if (
      view.clickEvent &&
      pointInRect(
        view.clickEvent.gridPosX,
        view.clickEvent.gridPosY,
        tower.x,
        tower.y,
        tower.x + 1,
        tower.y + 1
      )
    ) {
      if (s.active !== null) {
        createTargetConnection(s, s.active, i);

        s.active = null;
      } else {
        s.active = i;
        clickedTower = true;
      }
    }

    // create soldiers / tick tower
    if (tower.targets.length) {
      // delay between 30-40 ticks
      let delay =
        ((tower.maxValue - tower.value - activeTowerDelayMin) /
          (tower.maxValue - activeTowerDelayMin)) *
          (activeTowerDelayMax - activeTowerDelayMin) +
        activeTowerDelayMin;

      // tower at max gets to go twice as fast
      if (tower.value === tower.maxValue) {
        delay = delay * 0.5;
      }

      // divide among # targets
      let multiplier = tower.targets.length * 0.8;
      if (multiplier < 1) {
        multiplier = 1;
      }
      delay *= multiplier;

      for (let j = 0; j < tower.targets.length; j++) {
        let target = tower.targets[j];
        if (target.ticksSinceUpdate >= delay) {
          s.soldiers.push(createSoldier(s, i, target.index));

          target.ticksSinceUpdate = 0;
        }

        target.ticksSinceUpdate += 1;
      }

      tower.ticksSinceUpdate = 0;
    }

    if (tower.ticksSinceUpdate >= inactiveTowerDelay) {
      tower.value += 1;
      tower.ticksSinceUpdate = 0;
    }

    tower.ticksSinceUpdate += 1;

    if (tower.value > tower.maxValue) {
      tower.value = tower.maxValue;
    }
  } // towers

  if (view.clickEvent && !clickedTower) {
    s.active = null;
  }

  view.clickEvent = null;

  return s;
};
