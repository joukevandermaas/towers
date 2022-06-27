import { gridToView, viewToGrid, viewToGridBound } from "./helpers";

interface Click {
  gridPosX: number;
  gridPosY: number;
}

export interface ViewState {
  screenWidth: number;
  screenHeight: number;
  gridSize: number;

  gridWidth: number;
  gridHeight: number;

  mousePosX: number;
  mousePosY: number;

  gridMousePosX: number;
  gridMousePosY: number;

  mouseDown: boolean;

  clickEvent: Click | null;
}

export const padding = 25;

const currentViewState: ViewState = {
  screenWidth: 0,
  screenHeight: 0,
  gridSize: 0,

  gridWidth: 0,
  gridHeight: 0,

  mousePosX: 0,
  mousePosY: 0,

  gridMousePosX: 0,
  gridMousePosY: 0,

  mouseDown: true,

  clickEvent: null,
};

export const initView = (gridWidth: number, gridHeight: number): CanvasRenderingContext2D => {
  let canvas = document.querySelector("#main") as HTMLCanvasElement;
  let setSize = () => {
    let rect = document.body.getBoundingClientRect();

    let cwidth = rect.width;
    let cheight = rect.height;

    canvas.width = cwidth;
    canvas.height = cheight;

    currentViewState.screenWidth = cwidth;
    currentViewState.screenHeight = cheight;

    let dwidth = cwidth - padding * 2;

    let gridCell = dwidth / gridWidth;
    let gwidth = dwidth;
    let gheight = gridHeight * gridCell;

    currentViewState.gridWidth = gwidth;
    currentViewState.gridHeight = gheight;
    currentViewState.gridSize = gridCell;
  };

  window.onresize = setSize;
  setSize();

  let context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("Could not create context");
  }

  canvas.addEventListener("mousemove", (e) => {
    currentViewState.mousePosX = e.clientX;
    currentViewState.mousePosY = e.clientY;

    currentViewState.gridMousePosX = viewToGridBound(currentViewState, e.clientX);
    currentViewState.gridMousePosY = viewToGridBound(currentViewState, e.clientY);
  });

  canvas.addEventListener("mousedown", (e) => {
    currentViewState.mouseDown = true;
  });
  canvas.addEventListener("mouseup", (e) => {
    currentViewState.mouseDown = false;
  });
  canvas.addEventListener("click", (e) => {
    currentViewState.clickEvent = {
      gridPosX: viewToGridBound(currentViewState, e.clientX),
      gridPosY: viewToGridBound(currentViewState, e.clientY),
    };
  });

  return context;
};

export const getViewState = () => currentViewState;
