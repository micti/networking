import { _h } from '../../../util.mjs'

const TYPE = '002b'

const build = () => Buffer.from([0, 43, 0, 5, 4, 3, 4, 3, 3])

const parse = (data) => ({
  version: _h(data)
})

export default {
  build,
  parse,
  TYPE
}
