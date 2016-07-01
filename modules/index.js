import { identity, lookupWithDefault } from './utils';

export default function createReducerFromStateMachine(machine, initial) {

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

  return function reducer(appState = initialAppState, action) {
    const { currentState, data } = appState; 

    const stateDef = machineStates.get(currentState);
    const nextState = lookupWithDefault(stateDef, currentState/* default */, 
        // property path in object
        'actions', action.type);
    const nextStateDef = machineStates.get(nextState);
    const stateData = (nextStateDef.reducer || identity)(data, action);
   
    return {
      currentState : nextState,
      data : stateData
    };
  };
}
