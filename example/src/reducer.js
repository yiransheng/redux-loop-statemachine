import {loop} from 'redux-loop';
import createReducerFromDFA, {TransitionEff}  from './lib';

import {
  CLEAR,
  RECT_DRAWING,
  RECT_DRAWN,
  RECT_MOVING,

  MOUSE_DOWN,
  MOUSE_MOVE,
  MOUSE_UP,
  CLEAR_CANVAS 
} from './constants';

import {
  cornerToBox,
  ptAdd,
  ptInRect
} from './helpers';

/*
 * DFA State Machine, modeling App states.
 * It should be an array of state definitions, which are objects with
 * a pretty straight-forward recipie. 
 * 
 * state :: String|Symbol - identifier of unique states
 * transitions : Object - represent _deterministic_ transitions
 * 
 *  - each transtion should be a key,value map, with key being
 *    action type, and value should be a redux-loop reducer  
 *
 *  - transition is signaled by returning a redux-loop effect
 *    The effect can be created by using TransitionEff.constant
 *    or TransitionEff.promise
 *    which are wrappers to create .constant and .promise type
 *    effects
 *  - This offers the flexibility to have dynamic transitions based 
 *    not only on action type, but also action payload and app state
 *  - TransitionEff.constant takes a single input of transition toState
 *  - TransionbtEff.promise takes a factory and args that resolve to a
 *    DFA state async
 *
 *  In this example, only constant effect is used.
 */
const stateMachine = [
  {
    state : CLEAR,
    transitions : {
      [MOUSE_DOWN] : (state, action) => loop(
        {...state, topLeft: action.payload.point},
        TransitionEff.constant(RECT_DRAWING)
      )
    }
  },
  {
    state : RECT_DRAWING,
    transitions : {
      [MOUSE_UP] : (state, action) => loop(
        {...state, bottomRight: action.payload.point},
        TransitionEff.constant(RECT_DRAWN)
      ),
      [MOUSE_MOVE] : (state, action) => loop(
        {...state, bottomRight: action.payload.point},
        TransitionEff.constant(RECT_DRAWING)
      )
    }
  },
  {
    state : RECT_DRAWN,
    transitions : {
      [MOUSE_DOWN](state, action) {
        const { point } = action.payload;
        const { bottomRight } = state;

        const [x,y] = bottomRight;
        const bottomRightCornerRect = {
          topLeft : [x-10, y-10],
          bottomRight: [x+10, y+10]
        }

        if (ptInRect(point, bottomRightCornerRect)) {
          return loop({...state, bottomRight:point},
            TransitionEff.constant(RECT_DRAWING));
        } else if(ptInRect(point, state)) {
          return loop({ 
            ...state, 
            anchor: point, 
            topLeftAnchor: state.topLeft, 
            bottomRightAnchor: state.bottomRight 
          }, TransitionEff.constant(RECT_MOVING));
        } else {
          return loop({topLeft: null, bottomRight:null}, 
            TransitionEff.constant(CLEAR));
        }
      }
    }
  },
  {
    state : RECT_MOVING,
    transitions : {
      [MOUSE_MOVE](state, action) {
        const { point } = action.payload;
        const [x0, y0] = state.anchor;
        const [x1, y1] = point;
        const { topLeftAnchor, bottomRightAnchor } = state;
        return loop({
          ...state,
          topLeft : ptAdd(topLeftAnchor, [x1-x0,y1-y0]),
          bottomRight : ptAdd(bottomRightAnchor, [x1-x0,y1-y0]),
        }, TransitionEff.constant(RECT_MOVING));
      },
      [MOUSE_UP](state, action) {
        const {topLeft, bottomRight} = state;
        return loop({topLeft, bottomRight}, 
          TransitionEff.constant(RECT_DRAWN));
      }
    }
  }
];

const rootReducer = createReducerFromDFA(stateMachine, {
  initialState : CLEAR,
  data : { topLeft : null, bottomRight : null}
});

export default rootReducer;
