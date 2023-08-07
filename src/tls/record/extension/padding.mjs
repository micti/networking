const TYPE = '0015'

const build = (size) => {
  const buffer = Buffer.alloc(4 + size)
  buffer[1] = 21 // type
  buffer.writeInt16BE(size, 2) // length

  return buffer
}

export default {
  // parse,
  build,
  TYPE
}
