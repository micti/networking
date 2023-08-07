import { buildList } from './common.mjs'

const TYPE = '000d'

const build = (list) => buildList(TYPE, list)

export default {
  TYPE,
  build
}
