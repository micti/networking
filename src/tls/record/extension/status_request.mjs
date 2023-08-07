import { h } from '../../../util.mjs'

const TYPE = '0005'

const build = (type = '01') => {
  if (!type) return h(TYPE + '0005' + type + '00000000') // empty responder, request extension length = 0
  // not support
  return h(TYPE + '0005' + type + '00000000')
}

export default {
  // parse,
  build,
  TYPE
}
