import {Effects} from 'redux-loop';

export function constant(toState) {
  return Effects.constant({ 
    type: '@@StateMachine/Transition',
    payload : {
      toState
    }
  });
}

export function promise(factory, ...args) {
  const effFactory = (...args) => factory(...args).then(constant);
  return Effects.promise(effFactory, ...args);
}
