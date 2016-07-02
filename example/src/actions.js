import {
  MOUSE_DOWN,
  MOUSE_MOVE,
  MOUSE_UP
} from './constants';

// creat actions from mouse event
// i.e. take out cientX and clientY,
// and repent the point as an array of two elements
function mouseActionFactory(type) {
  return e => {
    return { type, payload : { 
             point: [e.clientX, e.clientY] }};
  };
}

const mouseDown = mouseActionFactory(MOUSE_DOWN);
const mouseUp = mouseActionFactory(MOUSE_UP);
const mouseMove = mouseActionFactory(MOUSE_MOVE);

export {
  mouseDown,
  mouseUp,
  mouseMove
};

