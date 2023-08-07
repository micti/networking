import { h } from '../../../util.mjs'

export const buildList = (type, list, listLengthBytes = 2) => {
  const listBuffer = h(list.join(''))
  const prefixBuffer = Buffer.alloc(4 + listLengthBytes)
  prefixBuffer.write(type, 'hex')
  prefixBuffer.writeInt16BE(listBuffer.length + listLengthBytes, 2)
  prefixBuffer.writeIntBE(listBuffer.length, 4, listLengthBytes)

  return Buffer.concat([prefixBuffer, listBuffer])
}

/**
 *
 * @param {string} type Type code in HEX text
 * @param {string[]} list List in text
 */
export const buildNotFixedList = (type, list, listLengthBytes = 2) => {
  const listBuffer = Buffer.from(list.map(l => String.fromCharCode(l.length) + l).join(''))
  const prefixBuffer = Buffer.alloc(4 + listLengthBytes)
  prefixBuffer.write(type, 'hex')
  prefixBuffer.writeInt16BE(listBuffer.length + 2, 2)
  prefixBuffer.writeIntBE(listBuffer.length, 4, listLengthBytes)

  return Buffer.concat([prefixBuffer, listBuffer])
}
