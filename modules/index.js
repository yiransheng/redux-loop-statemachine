import { loop, Effects, getModel, getEffect } from 'redux-loop';

import { identity, lookupWithDefault } from './utils';
import { constant, promise } from './effects';

const TransitionEff = {constant, promise};

export {
  TransitionEff
};

export default function createReducerFromDFA(machine, initial) {

  if(!machine.length) {
    return () => ({ currentState: null, data:null });
  }

  const machineStates = new Map(
    machine.map(s => [s.state, s])
  );

  const { initialState, data } = 
    (initial || { initialState: machine[0].state, data: null });
  // make a copy of initial if it's supplied
  // rename property initialState -> currentState
  const initialAppState = {
    currentState : initialState,
    data : data
  };

  function transitionReducer(appState, action) {
    if(action.type === '@@StateMachine/Transition') {
      const { currentState } = appState;
      const { fromState, toState } = action.payload;
      return (
        fromState === currentState ? 
        { ...appState, currentState: toState, prevState: fromState } : 
        appState
      );
    }
    return appState;
  }

  return function (appState = initialAppState, action) {
    
    const nextAppState = transitionReducer(appState, action);
    if(appState !== nextAppState) {
      return nextAppState;
    }
    const { currentState, data } = appState;

    const stateDef = machineStates.get(currentState);
    const { transitions } = stateDef;
    const reducer = transitions[action.type] || transitions['*'] || identity;

    const nextDataState = reducer(data, action);
    const nextModel = getModel(nextDataState); 
    let eff = getEffect(nextDataState);
    if(eff) {
      eff = Effects.lift(eff, (action) => {
        let { type, payload } = action;
        if (type === '@@StateMachine/Transition') {
          payload = { ...payload, fromState: currentState };
          return { type, payload };
        }
        return action;
      });
    } else {
      eff = Effects.none();
    }
   
    return loop({
      currentState, 
      data : nextModel
    }, eff);
  };
}
