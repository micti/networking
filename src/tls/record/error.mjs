import { _h } from '../../util.mjs'
import { errors } from '../contanst.mjs'

const parse = (data) => {
  const level = data.readInt8()
  const description = data.readInt8(1)

  return {
    level,
    code: description,
    description: (errors[description] || 'unknown_error') + ' (' + _h(data) + ')'
  }
}

export default {
  parse
}
