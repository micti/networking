import { randomBytes } from 'crypto'

import { build as extensions } from './extension/index.mjs'
import { writeBuffer, writeBufferAndPrefixLenght, writeBufferHex } from '../../util.mjs'

const TYPE = '16'

const build = (ciphers, options) => {
  const buffer = Buffer.alloc(600)

  let pos = 0

  buffer.write('160301', 'hex')
  // skip 2 bytes for late update record size
  pos = 5

  buffer.write('01', pos, 'hex')
  // skip 3 bytes for late update handshake size
  pos = 9

  // write version + random
  buffer.write('0303', pos, 'hex')
  pos += 2
  randomBytes(32).copy(buffer, pos) // client random
  pos += 32
  buffer.write('20', pos, 'hex') // session length
  pos += 1
  randomBytes(32).copy(buffer, pos) // session id
  pos += 32

  // write cipher
  pos = writeBufferAndPrefixLenght(buffer, Buffer.from(ciphers.join(''), 'hex'), pos, 2)
  // compression method
  pos = writeBufferHex(buffer, '0100', pos)

  const padding = options.extensions?.padding === true
  const extensionBuffers = Object.keys(options.extensions).filter(ext => ext !== 'padding').map(ext => extensions[ext](options.extensions[ext]))
  const extensionLenghtPos = pos
  pos += 2 // skip for ext length
  let extensionLength = 0
  extensionBuffers.forEach(extension => {
    pos = writeBuffer(buffer, extension, pos)
    extensionLength += extension.length
  })

  if (pos < 512 && padding) {
    const paddingBuffer = extensions.padding(517 - pos - 4)
    extensionLength += 517 - pos
    pos = writeBuffer(buffer, paddingBuffer, pos)
  }

  buffer.writeIntBE(extensionLength, extensionLenghtPos, 2)

  // update size
  const handshakeSize = pos - 9
  const recodeSize = pos - 5
  buffer.writeIntBE(handshakeSize, 6, 3)
  buffer.writeIntBE(recodeSize, 3, 2)

  return buffer.subarray(0, pos)
}

export default {
  build,
  TYPE
}
