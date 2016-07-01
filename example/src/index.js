import React, { Component } from 'react';
import { render } from 'react-dom';
import { createStore } from 'redux';
import { Provider, connect } from 'react-redux';
import {loop, install} from 'redux-loop';

import createReducerFromStateMachine, {TransitionEff}  from './lib';

// state names
const CLEAR = Symbol('IDLE');
const DRAWING = Symbol('MOVEGING');
const DRAWN = Symbol('DRAWN'); 
const MOVE_RECT = Symbol('MOVE_RECT');

// action constants
const MOUSE_DOWN = 'MOUSE_DOWN'; 
const MOVE = 'MOVE';
const MOUSE_UP = 'MOUSE_UP';
const CLEAR_CANVAS = 'CLEAR_CANVAS';

const initialAppState = {
  topLeft : null,
  bottomRight : null
};
// helper function
const createPartialReducer = (actionTypes) => {
  return (state, action) => {
    if(actionTypes.has(action.type)) {
      return Object.assign({}, state, action.payload);
    }
    return state;
  };
};

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
const ptInRect = (pt, rect) => {
  const {x,y,width,height} = cornerToBox(rect);
  const [x0, y0] = pt;
  return x0 >= x && y0 >= y && (x0 - x) <= width && (y0-y) <= height;
};

const addPt = (pt1, pt2) => {
  const [x1,y1] = pt1;
  const [x2,y2] = pt2;
  return [x1+x2,y1+y2];
}

const stateMachine = [
  {
    state : CLEAR,
    transitions : {
      [MOUSE_DOWN] : (state, action) => loop(
        createPartialReducer(new Set([MOUSE_DOWN]))(state,action),
        TransitionEff.constant(DRAWING)
      )
    }
  },
  {
    state : DRAWING,
    transitions : {
      [MOUSE_UP] : (state, action) => loop(
        state,
        TransitionEff.constant(DRAWN)
      ),
      [MOVE] : (state, action) => loop(
        createPartialReducer(new Set([MOVE]))(state,action),
        TransitionEff.constant(DRAWING)
      )
    }
  },
  {
    state : DRAWN,
    transitions : {
      [MOUSE_DOWN](state, action) {
        const { topLeft } = action.payload;
        const { bottomRight } = state;

        const [x,y] = bottomRight;
        const bottomRightCornerRect = {
          topLeft : [x-10, y-10],
          bottomRight: [x+10, y+10]
        }

        if (ptInRect(topLeft, bottomRightCornerRect)) {
          return loop({topLeft:state.topLeft, bottomRight: topLeft},
            TransitionEff.constant(DRAWING));
        } else if(ptInRect(topLeft, state)) {
          return loop({ ...state, anchor: topLeft, topLeftAnchor: state.topLeft, bottomRightAnchor: state.bottomRight }, 
            TransitionEff.constant(MOVE_RECT));
        } else {
          return loop({topLeft: null, bottomRight:null}, 
            TransitionEff.constant(CLEAR));
        }
      }
    }
  },
  {
    state : MOVE_RECT,
    transitions : {
      [MOVE](state, action) {
        const { bottomRight } = action.payload;
        const [x0, y0] = state.anchor;
        const [x1, y1] = bottomRight;
        return loop({
          ...state,
          topLeft : addPt(state.topLeftAnchor, [x1-x0,y1-y0]),
          bottomRight : addPt(state.bottomRightAnchor, [x1-x0,y1-y0]),
        }, TransitionEff.constant(MOVE_RECT));
      },
      [MOUSE_UP](state, action) {
        const {topLeft, bottomRight} = state;
        return loop({topLeft, bottomRight}, TransitionEff.constant(DRAWN));
      }
    }
  }
];

const rootReducer = createReducerFromStateMachine(stateMachine, {
  initialState : CLEAR,
  data : initialAppState
});

const Box = ({ topLeft, bottomRight, style={} }) => {

  const attribs = cornerToBox({ topLeft, bottomRight });

  return (
    <rect style={style} {...attribs} fill="rgba(0,0,0,.2)" stroke="rgba(0,0,0,.3)" strokeWidth="1" />
  );

};

const Triangle = ({ point }) => {
  if(!point) return <path/>;
  const [x,y] = point;
  const d = `M${x},${y}L${x-15},${y}L${x},${y-15}Z`;
  return <path d={d} fill='rgba(0,0,0,.3)' />;
};

const App = connect(a => a)(class extends Component {

  render() {

    const { currentState, data, dispatch } = this.props;
    const box = <Box {...data} />;

    const {topLeftAnchor,bottomRightAnchor,topLeft,bottomRight} = data;
    let box2;
    if(topLeftAnchor && bottomRightAnchor) {
      box2 = <Box topLeft={topLeftAnchor} bottomRight={bottomRightAnchor} style={{
        strokeDasharray: "5,5",
        fill  : "none"
      }}/> 
    } else {
      box2 = <Box topLeft={topLeft} bottomRight={bottomRight} style={{
        strokeDasharray: "5,5",
        fill  : "none"
      }}/> 
    }

    const cursor = currentState === MOVE_RECT ? 'move' : 
      (currentState === DRAWING ? 'nwse-resize' : 'auto');

    return (
      <div>
        <div style={{ cursor }}>
          <svg
            onMouseDown={e => dispatch({ type: MOUSE_DOWN, payload: { topLeft: [e.clientX, e.clientY] }})}
            onMouseMove={e => (currentState === DRAWING || currentState === MOVE_RECT) && dispatch({ type: MOVE, payload: { bottomRight: [e.clientX, e.clientY] }})}
            onMouseUp={e => dispatch({ type: MOUSE_UP, payload: { bottomRight: [e.clientX, e.clientY] }})}
            width={500}
            height={250}
            style={{ border: '1px solid #888' }}
           >
           {box2}
           {box}
           <Triangle point={bottomRight}/>
          </svg>
        </div>
        <span>Current State: { currentState.toString() }</span>
      </div>
    )

  };
});

const store = install()(createStore)(rootReducer);

/**
 * Make some magic!
 */
render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.querySelector('main')
);
