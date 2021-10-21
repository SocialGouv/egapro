import deepmerge from "deepmerge"

/*
functions from deepmerge documentation
*/

export const overwriteMerge = (destinationArray, sourceArray) => sourceArray

const emptyTarget = (value) => (Array.isArray(value) ? [] : {})

const clone = (value, options) => deepmerge(emptyTarget(value), value, options)

export const combineMerge = (target, source, options) => {
  const destination = target.slice()

  source.forEach((item, index) => {
    if (typeof destination[index] === "undefined") {
      const cloneRequested = options.clone !== false
      const shouldClone = cloneRequested && options.isMergeableObject(item)
      destination[index] = shouldClone ? clone(item, options) : item
    } else if (options.isMergeableObject(item)) {
      destination[index] = deepmerge(target[index], item, options)
    } else if (target.indexOf(item) === -1) {
      destination.push(item)
    }
  })
  return destination
}
