import { buildNotFixedList } from './common.js'

const TYPE = '0010'

// nothing now
const build = (list) => buildNotFixedList(TYPE, list)

export default {
  TYPE,
  build
}
