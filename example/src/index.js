import React, { Component } from 'react';
import { render } from 'react-dom';
import { createStore } from 'redux';
import { Provider, connect } from 'react-redux';
import {loop, install} from 'redux-loop';

import {TransitionEff}  from './lib';

import rootReducer from './reducer';
import {mouseUp,mouseDown,mouseMove} from './actions';
import {cornerToBox, compose, noop} from './helpers';
import {RECT_MOVING, RECT_DRAWING} from './constants';

// functional component for drawing a Box with svg <rect />
const Box = ({ topLeft, bottomRight, style={} }) => {
  const attribs = cornerToBox({ topLeft, bottomRight });
  return (
    <rect style={style} {...attribs} />
  );
};

// functional component for drawing a "resizing" triangle
// at lower right corner of a Box
const Triangle = ({ point }) => {
  if(!point) return <path/>;
  const [x,y] = point;
  const d = `M${x},${y}L${x-15},${y}L${x},${y-15}Z`;
  return <path d={d} fill='rgba(0,0,0,.3)' />;
};

// main App, connected to rootReducer
const App = connect(a => a)(class extends Component {

  render() {

    // Refer to reducer.js for stateMachine definition
    // shape of redux-loop-statemachine state tree:
    // {
    //   currentState,
    //   prevState
    //   data
    // }
    const {currentState, prevState, data, dispatch} = this.props;
    // box data
    const {topLeftAnchor,bottomRightAnchor,topLeft,bottomRight} = data;

    const box = <Box {...data} style={{ fill: 'rgba(0,0,0,.3)' }}/>;
    const frameStyle = {
      strokeDasharray: "5,5",
      strokeWidth: 1,
      stroke: 'rgba(0,0,0,.4)',
      fill  : "#fff"
    };
    let boxFrame;
    // This demonstrates different rendering based on DFA state
    // boxFrame is another box with different style and rendered behind
    // our box/rect 
    // When Moving a Rect, we draw the frame at its original position
    // otherwise just draw it at the same position as the Rect itself
    if(currentState === RECT_MOVING) {
      boxFrame = <Box topLeft={topLeftAnchor} 
                      bottomRight={bottomRightAnchor} 
                      style={frameStyle}/>;
    } else {
      boxFrame = <Box topLeft={topLeft} 
                      bottomRight={bottomRight} 
                      style={frameStyle} />
    }

    // also use different mouse cursor based on DFA state
    const cursor = currentState === RECT_MOVING ? 'move' : 
      (currentState === RECT_DRAWING ? 'nwse-resize' : 'auto');


    // compose dispatch and action creators for event callback
    const onMouseDown = compose(dispatch, mouseDown);
    const onMouseUp = compose(dispatch, mouseUp); 
    // only dispatch event for relevant DFA state, a bit of optimization
    const onMouseMove = (currentState === RECT_DRAWING || currentState === RECT_MOVING) ?
            compose(dispatch, mouseMove) :
            noop; 
    const svgStyle = { border: '1px solid #888', 
                       width: '100vw', 
                       height: 'calc(100vh - 50px)', 
                       background:'#f6f6f6' } 

    return (
      <div>
        <div style={{ cursor }}>
          <svg
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onMouseMove={onMouseMove}
            style={svgStyle}>
           {boxFrame}
           {box}
           <Triangle point={bottomRight}/>
          </svg>
        </div>
        <span>Current State: { currentState.toString() } Previous State: { (prevState || '').toString() }</span>
      </div>
    )
  };
});

// install redux-loop
const store = install()(createStore)(rootReducer);

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.querySelector('main')
);
