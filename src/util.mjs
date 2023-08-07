const _ = (s) => s.replace(/ /g, '')
const h = (s) => Buffer.from(_(s), 'hex')
const _h = (b) => b.toString('hex')
const copy = (b) => {
  const n = Buffer.allocUnsafe(b.length)
  b.copy(n)

  return n
}
const empty = Buffer.from('')

const writeBufferAndPrefixLenght = (buffer, data, start, lenghtPos = 3) => {
  const len = data.length
  buffer.writeIntBE(len, start, lenghtPos)
  data.copy(buffer, start + lenghtPos)

  return start + lenghtPos + len
}

const writeBufferHex = (buffer, data, start) => {
  buffer.write(data, start, 'hex')

  return start + data.length / 2
}

const writeBuffer = (buffer, data, start) => {
  data.copy(buffer, start)

  return start + data.length
}

export {
  empty,
  _,
  h,
  _h,
  copy,
  writeBufferAndPrefixLenght,
  writeBufferHex,
  writeBuffer
}
