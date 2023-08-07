import {
  createHash,
  createHmac,
  createCipheriv,
  createDecipheriv
} from 'node:crypto'

const zeroKey = Buffer.alloc(48, 0)

const CIPHER_INFO = {
  1301: {
    hash: 'sha256',
    hashLength: 32,
    algorithm: 'aes-128-gcm',
    ivLength: 12,
    keyLength: 16,
    authTagLength: 16,
    zeroKey: zeroKey.subarray(0, 32)
  },
  1302: {
    hash: 'sha384',
    hashLength: 48,
    algorithm: 'aes-256-gcm',
    ivLength: 12,
    keyLength: 32,
    authTagLength: 16,
    zeroKey: zeroKey.subarray(0, 48)
  }
}

const tlsInfo = (length, label, context) => {
  const tlsLabel = 'tls13 ' + label
  const labelLength = tlsLabel.length
  const contextLength = context.length
  const info = Buffer.allocUnsafe(4 + labelLength + contextLength)

  info.writeInt16BE(length, 0)
  info.writeInt8(labelLength, 2)
  info.write(tlsLabel, 3, labelLength, 'ascii')
  info.writeInt8(contextLength, 3 + labelLength)
  context.copy(info, 3 + labelLength + 1)

  return info
}

const buildIv = (iv, recordSeq) => {
  const newIv = Buffer.allocUnsafe(iv.length)
  const pad = Buffer.alloc(iv.length, 0)

  pad.writeBigInt64BE(BigInt(recordSeq), iv.length - 8)

  for (let i = 0; i < iv.length; i++) {
    newIv[i] = iv[i] ^ pad[i]
  }

  return newIv
}

class Cipher {
  constructor (cipher) {
    this.config = CIPHER_INFO[cipher]
    this.decryptKey = null
    this.decryptIv = null
    this.encryptKey = null
    this.encryptIv = null
  }

  setDecryptKeyAndIv (key, iv) {
    this.decryptKey = key
    this.decryptIv = iv
  }

  setEncryptKeyAndIv (key, iv) {
    this.encryptKey = key
    this.encryptIv = iv
  }

  getLength () {
    return {
      iv: this.config.ivLength,
      key: this.config.keyLength
    }
  }

  zeroKey () {
    return this.config.zeroKey
  }

  hash (data) {
    const { hash } = this.config

    const h = createHash(hash)

    if (Array.isArray(data)) {
      data.forEach(d => h.update(d))
      return h.digest()
    }

    return h.update(data).digest()
  }

  hfkdExtract (key, salt) {
    const { hash, zeroKey } = this.config

    return createHmac(hash, salt.length === 0 ? zeroKey : salt).update(key).digest()
  }

  hfkdExpandLabel (prk, label, context, length = null) {
    const { hash, hashLength } = this.config

    if (!length) length = hashLength

    const info = tlsInfo(length, label, context)
    const steps = Math.ceil(length / hashLength)
    const t = Buffer.allocUnsafe(hashLength * steps + info.length + 1)

    info.copy(t, hashLength * steps)

    for (let i = 1; i <= steps; i++) {
      t[hashLength * steps + info.length] = i
      const h = createHmac(hash, prk)
      if (i >= 2) {
        h.update(t.subarray((i - 2) * hashLength, (i - 1) * hashLength))
      }
      h.update(t.subarray(hashLength * steps))
      h.digest().copy(t, (i - 1) * hashLength)
    }

    return t.subarray(0, length)
  }

  decryptRecord (record, recordSeq) {
    const { algorithm, authTagLength } = this.config

    const de = createDecipheriv(algorithm, this.decryptKey, buildIv(this.decryptIv, recordSeq))
    de.setAuthTag(record.subarray(record.length - authTagLength))
    de.setAAD(record.subarray(0, 5))

    return Buffer.concat([
      de.update(record.subarray(5, record.length - authTagLength)),
      de.final()
    ])
  }

  encryptRecord (record, recordHeader, recordSeq) {
    const { algorithm, authTagLength } = this.config

    const bytesLength = Buffer.allocUnsafe(2)
    bytesLength.writeIntBE(record.length + authTagLength, 0, 2)
    const en = createCipheriv(algorithm, this.encryptKey, buildIv(this.encryptIv, recordSeq))
    en.setAAD(Buffer.concat([recordHeader, bytesLength]))

    return Buffer.concat([
      recordHeader,
      bytesLength,
      en.update(record),
      en.final(),
      en.getAuthTag()
    ])
  }
}

export default (cipher) => new Cipher(cipher)
