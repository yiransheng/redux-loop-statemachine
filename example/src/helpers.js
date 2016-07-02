// convert { topLeft, bottomRight } representation of a Box
// to { x, y, width, height }, more suitable for rendering svg <rect>
const cornerToBox = ({topLeft, bottomRight}={}) => {
  if(!topLeft || !bottomRight) {
    return {x:0,y:0,width:0,height:0};
  }
  const [x1, y1] = topLeft || [0, 0];
  const [x2, y2] = bottomRight || [0, 0];
  const width = Math.abs(x1 - x2);
  const height = Math.abs(y1 - y2);
  const x = Math.min(x1, x2);
  const y = Math.min(y1, y2);

  return {x,y,width,height};
};
// check if a point is in a box
const ptInRect = (pt, rect) => {
  const {x,y,width,height} = cornerToBox(rect);
  const [x0, y0] = pt;
  return x0 >= x && y0 >= y && (x0 - x) <= width && (y0-y) <= height;
};

// 2d vector addition
const ptAdd = (pt1, pt2) => {
  const [x1,y1] = pt1;
  const [x2,y2] = pt2;
  return [x1+x2,y1+y2];
}
// compose functions
const compose = (...funcs) => {
  if(!funcs.length) throw Error("No function to compose");
  if(funcs.length === 1) return funcs[0];
  const len = funcs.length;
  funcs.reverse();
  return function(...args) {
    let result = funcs[0](...args);
    for(let i=1; i<len; i++) {
      result = funcs[i](result); 
    }  
    return result;
  };
}

const noop = ()=>undefined;

export {
  compose,
  noop,
  cornerToBox,
  ptInRect,
  ptAdd
}
