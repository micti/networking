import { buildList } from './common.js'

const TYPE = '000a'

const build = (list) => buildList(TYPE, list)

export default {
  TYPE,
  build
}
