import { _h } from '../../util.js'
import { errors } from '../contanst.js'

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
