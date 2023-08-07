import { buildList } from './common.mjs'

const TYPE = '0022'

const build = (list) => buildList(TYPE, list)

export default {
  TYPE,
  build
}
