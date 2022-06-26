import { renderFrame } from "./render";
import { DefaultGameState, tick } from "./tick";

let canvas = document.querySelector("#main") as HTMLCanvasElement;
let setSize = () => {
  let rect = document.body.getBoundingClientRect();

  canvas.width = rect.width;
  canvas.height = rect.height;
};

window.onresize = setSize;
setSize();

let context = canvas.getContext("2d");
if (context === null) {
  throw new Error("Could not create context");
}

let ctx = context;

let prevstate = DefaultGameState;
let state = DefaultGameState;

let frameLoop = () => {
  renderFrame(ctx, prevstate, state);
  requestAnimationFrame(frameLoop);
};

let stateLoop = () => {
  let prev = state;
  prevstate = prev;
  state = tick(state);
  setTimeout(stateLoop, 50);
};

stateLoop();
frameLoop();
