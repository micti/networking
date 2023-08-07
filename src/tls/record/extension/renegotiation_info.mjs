import { h } from '../../../util.mjs'

const TYPE = 'FF01'

const build = (data = null) => {
  if (!data) return h(TYPE + '000100')
  // not support
  return h(TYPE + '000100')
}

export default {
  // parse,
  build,
  TYPE
}
