import { GameState, Team, Tower, TowerType } from "./tick";

const padding = 25;
const gridPadding = 4;
const gridColor = "#101e36";
const connectionColor = "white";

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
  state: GameState
) => {
  let { width: cwidth, height: cheight } = context.canvas;
  let dwidth = cwidth - padding * 2;
  let dheight = cheight - padding * 2;

  let gridCell = dwidth / state.gridWidth;
  let gwidth = dwidth;
  let gheight = state.gridHeight * gridCell;

  let ctx = context;
  let towers = state.towers;
  let soldiers = state.soldiers;

  ctx.clearRect(0, 0, cwidth, cheight);

  // Draw grid
  ctx.lineWidth = 1;
  ctx.strokeStyle = gridColor;

  for (let i = 0; i <= state.gridWidth; i++) {
    let x = i * gridCell;
    drawLine(x, 0, x, gheight);
  }
  for (let i = 0; i <= state.gridHeight; i++) {
    let y = i * gridCell;
    drawLine(0, y, gwidth, y);
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
  for (let i = 0; i < soldiers.length; i++) {
    let soldier = soldiers[i];
    let color = teamColors[soldier.team];

    ctx.fillStyle = color;

    pathCircle(
      gridToFrame(soldier.x) + padding,
      gridToFrame(soldier.y) + padding,
      gridCell / 5
    );

    ctx.fill();
  }

  // draw towers
  ctx.font = `bold ${gridCell / 2}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i < towers.length; i++) {
    let tower = towers[i];
    let color = teamColors[tower.team];

    ctx.fillStyle = color;
    fillTower(tower);

    ctx.strokeStyle = color;
    ctx.fillStyle = "white";

    let text = tower.value === tower.maxValue ? "max" : tower.value.toString();

    ctx.strokeText(
      text,
      gridToFrame(tower.x) + padding,
      gridToFrame(tower.y) + padding + gridPadding
    );
    ctx.fillText(
      text,
      gridToFrame(tower.x) + padding,
      gridToFrame(tower.y) + padding + gridPadding
    );
  }

  // helpers
  function connectCells(x1: number, y1: number, x2: number, y2: number) {
    drawLine(
      gridToFrame(x1),
      gridToFrame(y1),
      gridToFrame(x2),
      gridToFrame(y2)
    );
  }
  function gridToFrame(coord: number): number {
    return coord * gridCell + gridCell / 2;
  }
  function drawLine(x1: number, y1: number, x2: number, y2: number): void {
    ctx.beginPath();
    ctx.moveTo(x1 + padding, y1 + padding);
    ctx.lineTo(x2 + padding, y2 + padding);
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
    ctx.moveTo(x, y - gridCell / 2 + gridPadding);
    ctx.lineTo(x + gridCell / 2 - gridPadding, y + gridCell / 2 - gridPadding);
    ctx.lineTo(x - gridCell / 2 + gridPadding, y + gridCell / 2 - gridPadding);
    ctx.closePath();
  }

  function fillTower(tower: Tower): void {
    let { x, y, type } = tower;

    switch (type) {
      case "regular":
        pathHexagon(
          gridToFrame(x) + padding,
          gridToFrame(y) + padding,
          gridCell / 2
        );
        break;
      case "attack":
        pathTriangle(
          gridToFrame(x) + padding,
          gridToFrame(y) + padding,
          gridCell / 2
        );
        break;
      case "defense":
        pathCircle(
          gridToFrame(x) + padding,
          gridToFrame(y) + padding,
          gridCell / 2
        );
        break;
    }

    ctx.fill();
  }
};
