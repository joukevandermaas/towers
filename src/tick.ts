const activeTowerDelayMin = 30;
const activeTowerDelayMax = 40;
const inactiveTowerDelay = 50;

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
}

export interface Target {
  index: number;
  ticksSinceUpdate: number;
}

interface Soldier {
  x: number;
  y: number;
  team: Team;

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
}

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
  };
}

export function createTarget(index: number): Target {
  return {
    index,
    ticksSinceUpdate: 0,
  };
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
      targets: [createTarget(2), createTarget(1)],
    }),
    createTower({
      x: 10,
      y: 6,
      value: 6,
      type: "defense",
      team: "purple",
      // targets: [createTarget(2)],
    }),
    createTower({
      x: 15,
      y: 4,
      value: 10,
      type: "attack",
      team: "red",
      targets: [createTarget(0)],
    }),
  ],

  soldiers: [],
};

function getAttackPower(tower: Tower) {
  return tower.type === "attack" ? 2 : 1;
}
function getDefensePower(tower: Tower) {
  return tower.type === "defense" ? 2 : 1;
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

export const tick = (state: GameState): GameState => {
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

    if (hasPassed(soldier.dx, soldier.dy, soldier.x, soldier.y, tx, ty)) {
      if (target.team === soldier.team) {
        target.value += soldier.defPower;
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
  for (let i = 0; i < s.towers.length; i++) {
    let tower = s.towers[i];

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
          let targetTower = s.towers[target.index];

          let { x: sx, y: sy } = tower;
          let { x: tx, y: ty } = targetTower;

          let dx = tx - sx;
          let dy = ty - sy;

          let m = Math.sqrt(dx ** 2 + dy ** 2) * 10;

          s.soldiers.push({
            source: i,
            target: target.index,
            team: tower.team,
            x: tower.x,
            y: tower.y,
            attPower: getAttackPower(tower),
            defPower: getDefensePower(tower),
            dx: dx / m,
            dy: dy / m,
          });

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
  }

  return s;
};
