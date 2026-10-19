import { buildList } from './common.js'

const TYPE = '0022'

const build = (list) => buildList(TYPE, list)

export default {
  TYPE,
  build
}
