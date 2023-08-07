const TYPE = '0000'

const parse = (buffer) => {
  return buffer
}

const build = (name) => {
  const buffer = Buffer.allocUnsafe(9 + name.length)

  buffer.write(TYPE, 0, 'hex')
  buffer.writeIntBE(9 + name.length - 4, 2, 2)
  buffer.writeIntBE(9 + name.length - 6, 4, 2)
  buffer.write('00', 6, 'hex')
  buffer.writeIntBE(name.length, 7, 2)
  buffer.write(name, 9)

  return buffer
}

export default {
  parse,
  build,
  TYPE
}
