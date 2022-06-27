import { ViewState } from "./view";

export const padding = 25;
export const gridPadding = 4;

export function gridToView(view: ViewState, coord: number): number {
  let cell = view.gridSize;
  return coord * cell + cell / 2 + padding;
}

export function gridBoundToView(view: ViewState, coord: number): number {
  let cell = view.gridSize;
  return coord * cell + padding;
}

export function viewToGrid(view: ViewState, coord: number): number {
  let cell = view.gridSize;
  return (coord - padding - cell / 2) / cell;
}

export function viewToGridBound(view: ViewState, coord: number): number {
  let cell = view.gridSize;
  return (coord - padding) / cell;
}

export function pointInRect(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  return px >= x1 && px < x2 && py >= y1 && py < y2;
}

export function lineCrossesRect(
  lx1: number,
  ly1: number,
  lx2: number,
  ly2: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number
) {
  let left = lineCrossesLine(lx1, ly1, lx2, ly2, rx, ry, rx, ry + rh);
  let right = lineCrossesLine(lx1, ly1, lx2, ly2, rx + rw, ry, rx + rw, ry + rh);
  let top = lineCrossesLine(lx1, ly1, lx2, ly2, rx, ry, rx + rw, ry);
  let bottom = lineCrossesLine(lx1, ly1, lx2, ly2, rx, ry + rh, rx + rw, ry + rh);

  return left || right || top || bottom;
}

export function lineCrossesLine(
  ax1: number,
  ay1: number,
  ax2: number,
  ay2: number,
  bx1: number,
  by1: number,
  bx2: number,
  by2: number
): boolean {
  // calculate the direction of the lines
  let uA: number =
    ((bx2 - bx1) * (ay1 - by1) - (by2 - by1) * (ax1 - bx1)) /
    ((by2 - by1) * (ax2 - ax1) - (bx2 - bx1) * (ay2 - ay1));
  let uB: number =
    ((ax2 - ax1) * (ay1 - by1) - (ay2 - ay1) * (ax1 - bx1)) /
    ((by2 - by1) * (ax2 - ax1) - (bx2 - bx1) * (ay2 - ay1));

  // if uA and uB are between 0-1, lines are colliding
  return uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1;
}
