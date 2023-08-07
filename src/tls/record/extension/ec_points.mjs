import { buildList } from './common.mjs'

const TYPE = '000b'

const build = (list) => buildList(TYPE, list, 1)

export default {
  TYPE,
  build
}
