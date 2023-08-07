import { buildNotFixedList } from './common.mjs'

const TYPE = '0010'

// nothing now
const build = (list) => buildNotFixedList(TYPE, list)

export default {
  TYPE,
  build
}
