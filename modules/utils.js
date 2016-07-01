/**
 * Identity function, Good for default reducer
 * @param {<T>} 
 * @return {T}
 */
export function identity(a) {
  return a;
}

/**
 * Look up value in object from path with default return
 * value if encounters undefined somewhere
 *
 * @param {?Object} object
 * @param {Any} defaultValue
 * @param {Array.<String>} ...path
 */
export function lookupWithDefault(object, defaultValue, ...path) {
  let value = object;
  for (let prop of path) {
    if(!value) return defaultValue;
    value = object[prop];
  }
  return value;
}
