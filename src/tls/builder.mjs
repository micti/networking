import { h } from '../util.mjs'
import ClientHelloRecord from './record/client_hello.mjs'
import ChangeCipherRecord from './record/change_cipher.mjs'

const seq = 0

class ClientBuilder {
  constructor (tls) {
    this.tls = tls
    this.seq = 0
  }

  setSeq (seq = 0) {
    this.seq = seq
  }

  clientHello (ciphers, options) {
    return ClientHelloRecord.build(ciphers, options)
  }

  changeCipher () {
    return ChangeCipherRecord.build()
  }

  handshake (type, data) {
    const l = Buffer.alloc(3)
    l.writeIntBE(data.length, 0, 3)

    return Buffer.concat([
      type,
      l,
      data
    ])
  }

  handshakeRecord (data) {
    return this.encryptRecord(Buffer.concat([data, h('16')]))
  }

  applicationRecord (data) {
    return this.encryptRecord(Buffer.concat([data, h('17')]))
  }

  encryptRecord = (data) => {
    return this.tls.getCipher().encryptRecord(data, h('170303'), seq)
  }
}

export const clientBuilder = (tls) => new ClientBuilder(tls)
