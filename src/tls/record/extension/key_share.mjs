import { copy, h, _h } from '../../../util.mjs'

const TYPE = '0033'

const parse = (data) => {
  const keyLength = data.readIntBE(2, 2)

  return {
    alo: _h(data.subarray(0, 2)),
    key: copy(data.subarray(4, 4 + keyLength))
  }
}

const build = (keys) => {
  const extensionLengthBuffer = Buffer.from([0, 0, 0, 0]) // all + list
  const parts = [h(TYPE), extensionLengthBuffer]
  const supportAlos = Object.keys(keys)

  let listLength = 0

  for (let i = 0; i < supportAlos.length; i++) {
    const aloBuffer = h(supportAlos[i])
    const keyBuffer = h(keys[supportAlos[i]])
    const keyLengthBuffer = Buffer.from([0, 0])

    keyLengthBuffer.writeInt16BE(keyBuffer.length)

    listLength += aloBuffer.length + keyBuffer.length + 2

    parts.push(aloBuffer)
    parts.push(keyLengthBuffer)
    parts.push(keyBuffer)
  }

  extensionLengthBuffer.writeInt16BE(listLength, 2)
  extensionLengthBuffer.writeInt16BE(listLength + 2, 0)

  return Buffer.concat(parts)
}

export default {
  parse,
  build,
  TYPE
}
