const TYPE = '001c'

const build = (size) => {
  const buffer = Buffer.from([0, 28, 0, 2, 0, 0]) // 001c0002....
  buffer.writeInt16BE(size, 4)

  return buffer
}

export default {
  // parse,
  build,
  TYPE
}
