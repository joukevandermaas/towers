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
