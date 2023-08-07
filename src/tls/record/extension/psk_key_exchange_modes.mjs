import { buildList } from './common.mjs'

const TYPE = '002d'

const build = (modes) => buildList(TYPE, modes, 1)

export default {
  TYPE,
  build
}
