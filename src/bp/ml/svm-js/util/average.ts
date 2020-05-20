const assert = require('assert')
const _a = require('mout/array')
const numeric = require('numeric')

export default function(arr) {
  const n = numeric.dim(arr)[0] || 0
  assert(n > 0, 'array cannot be empty')
  return (
    _a.reduce(
      arr,
      function(sum, v) {
        return sum + v
      },
      0
    ) / n
  )
}
