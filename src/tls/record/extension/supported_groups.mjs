import { buildList } from './common.mjs'

const TYPE = '000a'

const build = (list) => buildList(TYPE, list)

export default {
  TYPE,
  build
}
