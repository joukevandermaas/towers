import { renderFrame } from "./render";
import { DefaultGameState, tick } from "./tick";
import { getViewState, initView, ViewState } from "./view";

let ctx = initView(20, 10);

let prevstate = DefaultGameState;
let state = DefaultGameState;

let frameLoop = () => {
  renderFrame(ctx, prevstate, state, getViewState());
  requestAnimationFrame(frameLoop);
};

let stateLoop = () => {
  let prev = state;
  prevstate = prev;
  state = tick(state, getViewState());
  setTimeout(stateLoop, 50);
};

stateLoop();
frameLoop();
