const assert = require('assert')
const mout = require('mout'),
  _a = mout.array
const numeric = require('numeric')

import avg from './average'
import std from './standard-deviation'
import normalizeInput from './normalize-input'

export default function(dataset, mu?, sigma?) {
  assert(dataset instanceof Array, 'dataset must be an list of [X,y] tuples')
  assert(dataset.length > 0, 'dataset cannot be empty')

  const X = dataset.map(function(ex) {
      return ex[0]
    }),
    n = numeric.dim(X)[0] || 0,
    m = numeric.dim(X)[1] || 0

  assert(m > 0, 'number of features must be gt 0')

  mu =
    mu ||
    _a.range(m - 1).map(function(i) {
      return avg(
        X.map(function(x) {
          return x[i] || 0
        })
      )
    })
  sigma =
    sigma ||
    _a.range(m - 1).map(function(i) {
      return std(
        X.map(function(x) {
          return x[i] || 0
        })
      )
    })

  return {
    dataset: dataset.map(function(l) {
      return [normalizeInput(l[0], mu, sigma), l[1]]
    }),
    mu: mu,
    sigma: sigma
  }
}
