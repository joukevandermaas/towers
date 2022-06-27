import { gridToView } from "./helpers";
import { GameState, Team, Tower, TowerType } from "./tick";
import { padding, ViewState } from "./view";

const gridColor = "#101e36";
const connectionColor = "white";
export const gridPadding = 4;

const teamColors: Record<Team, string> = {
  none: "#7f7f7f",
  purple: "#7f38c7",
  blue: "#386fc7",
  red: "#c73865",
};

const hexAngle = (2 * Math.PI) / 6;

interface Connection {
  source: Tower;
  target: Tower;

  isTwoWay: boolean;

  color: string;
}

export const renderFrame = (
  context: CanvasRenderingContext2D,
  prevstate: GameState,
  state: GameState,
  view: ViewState
) => {
  let ctx = context;
  let towers = state.towers;
  let soldiers = state.soldiers;

  ctx.clearRect(0, 0, view.screenWidth, view.screenHeight);

  // Draw grid
  ctx.lineWidth = 1;
  ctx.strokeStyle = gridColor;
  ctx.lineCap = "round";

  let gridCell = view.gridSize;

  for (let i = 0; i <= state.gridWidth; i++) {
    let x = i * gridCell + padding;
    drawLine(x, padding, x, view.gridHeight + padding);
  }
  for (let i = 0; i <= state.gridHeight; i++) {
    let y = i * gridCell + padding;
    drawLine(padding, y, view.gridWidth + padding, y);
  }

  // draw connections
  let connectionMap: Record<string, Connection[]> = {};
  for (let i = 0; i < towers.length; i++) {
    let tower1 = towers[i];

    for (let j = 0; j < tower1.targets.length; j++) {
      let index = tower1.targets[j].index;
      let tower2 = towers[index];
      let color = teamColors[tower1.team ?? "grey"];

      let id = i < index ? `${i}${index}` : `${index}${i}`;

      if (connectionMap[id]) {
        let existing = connectionMap[id][0];
        existing.isTwoWay = true;

        connectionMap[id].push({
          color,
          source: tower1,
          target: tower2,
          isTwoWay: true,
        });
      } else {
        connectionMap[id] = [
          {
            color,
            source: tower1,
            target: tower2,
            isTwoWay: false,
          },
        ];
      }
    }
  }

  let keys = Object.keys(connectionMap);
  let connections: Connection[] = [];
  for (let i = 0; i < keys.length; i++) {
    let items = connectionMap[keys[i]];
    for (let j = 0; j < items.length; j++) {
      connections.push(items[j]);
    }
  }

  ctx.lineWidth = 7;
  ctx.strokeStyle = connectionColor;
  for (let i = 0; i < connections.length; i++) {
    let c = connections[i];

    ctx.strokeStyle = c.color;

    let x1 = c.source.x;
    let y1 = c.source.y;
    let x2 = c.target.x;
    let y2 = c.target.y;

    if (c.isTwoWay) {
      x2 = (x1 + x2) / 2;
      y2 = (y1 + y2) / 2;
    }

    connectCells(x1, y1, x2, y2);
  }

  // draw soldiers
  ctx.strokeStyle = "white";
  ctx.lineWidth = 1;
  for (let i = 0; i < soldiers.length; i++) {
    let soldier = soldiers[i];
    let color = teamColors[soldier.team];

    ctx.fillStyle = color;

    pathCircle(
      gridToView(view, soldier.x),
      gridToView(view, soldier.y),
      gridCell / 10
    );

    ctx.fill();

    pathCircle(
      gridToView(view, soldier.x),
      gridToView(view, soldier.y),
      gridCell / 10
    );

    ctx.stroke();
  }

  // draw towers
  ctx.font = `bold ${gridCell / 2}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i < towers.length; i++) {
    let tower = towers[i];
    let color = teamColors[tower.team];

    let size = i === state.hovered && i !== state.active ? 1.2 : 1;

    ctx.fillStyle = color;
    pathTower(tower, size);
    ctx.fill();

    if (i === state.active) {
      ctx.strokeStyle = "white";
      ctx.lineWidth = 3;
      pathTower(tower, size);
      ctx.stroke();
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;

    ctx.fillStyle = "white";

    let text = tower.value === tower.maxValue ? "max" : tower.value.toString();

    ctx.strokeText(
      text,
      gridToView(view, tower.x),
      gridToView(view, tower.y) + gridPadding
    );
    ctx.fillText(
      text,
      gridToView(view, tower.x),
      gridToView(view, tower.y) + gridPadding
    );
  }

  // helpers
  function connectCells(x1: number, y1: number, x2: number, y2: number) {
    drawLine(
      gridToView(view, x1),
      gridToView(view, y1),
      gridToView(view, x2),
      gridToView(view, y2)
    );
  }

  function drawLine(x1: number, y1: number, x2: number, y2: number): void {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  function pathHexagon(x: number, y: number, r: number) {
    ctx.beginPath();
    for (var i = 0; i < 6; i++) {
      ctx.lineTo(
        x + r * Math.cos(hexAngle * i),
        y + r * Math.sin(hexAngle * i)
      );
    }
    ctx.closePath();
  }
  function pathCircle(x: number, y: number, r: number) {
    ctx.beginPath();
    ctx.arc(x, y, r - gridPadding, 0, 2 * Math.PI);
  }
  function pathTriangle(x: number, y: number, r: number) {
    ctx.beginPath();
    let sidelength = (r - gridPadding) * 2;
    let height = Math.sqrt(sidelength ** 2 - (sidelength / 2) ** 2);

    let xdist = sidelength / 2;
    let ydist = height / 2;

    ctx.moveTo(x, y - ydist);
    ctx.lineTo(x + xdist, y + ydist);
    ctx.lineTo(x - xdist, y + ydist);
    ctx.closePath();
  }

  function pathTower(tower: Tower, sizeMultiplier: number = 1): void {
    let { x, y, type } = tower;

    let size = (sizeMultiplier * gridCell) / 2;

    switch (type) {
      case "regular":
        pathHexagon(gridToView(view, x), gridToView(view, y), size);
        break;
      case "attack":
        pathTriangle(gridToView(view, x), gridToView(view, y), size);
        break;
      case "defense":
        pathCircle(gridToView(view, x), gridToView(view, y), size);
        break;
    }
  }
};
