import * as curve25519 from 'curve25519-js'
import { empty } from '../util.mjs'

const getHandshakeKey = (data, privateKey, publicKey, cipher) => {
  const {
    iv: ivL,
    key: kL
  } = cipher.getLength()

  const helloHash = cipher.hash(data)
  const sharedKey = Buffer.from(curve25519.sharedKey(privateKey, publicKey))
  const emptyHash = cipher.hash(empty)
  const earlySecret = cipher.hfkdExtract(cipher.zeroKey(), Buffer.from('00', 'hex'))
  const derivedSecret = cipher.hfkdExpandLabel(earlySecret, 'derived', emptyHash)
  const handshakeSecret = cipher.hfkdExtract(sharedKey, derivedSecret)
  const clientHandshakeSecret = cipher.hfkdExpandLabel(handshakeSecret, 'c hs traffic', helloHash)
  const serverHandshakeSecret = cipher.hfkdExpandLabel(handshakeSecret, 's hs traffic', helloHash)

  return {
    handshakeSecret,
    clientHandshakeKey: cipher.hfkdExpandLabel(clientHandshakeSecret, 'key', empty, kL),
    clientHandshakeIv: cipher.hfkdExpandLabel(clientHandshakeSecret, 'iv', empty, ivL),
    serverHandshakeKey: cipher.hfkdExpandLabel(serverHandshakeSecret, 'key', empty, kL),
    serverHandshakeIv: cipher.hfkdExpandLabel(serverHandshakeSecret, 'iv', empty, ivL),
    clientFinishedKey: cipher.hfkdExpandLabel(clientHandshakeSecret, 'finished', empty)
  }
}

const getApplicationKey = (data, handshakeKey, cipher) => {
  const {
    iv: ivL,
    key: kL
  } = cipher.getLength()

  const handshakeHash = cipher.hash(data)
  const emptyHash = cipher.hash(empty)
  const derivedSecret = cipher.hfkdExpandLabel(handshakeKey.handshakeSecret, 'derived', emptyHash)
  const masterSecret = cipher.hfkdExtract(cipher.zeroKey(), derivedSecret)
  const clientAppTrafficCSecret = cipher.hfkdExpandLabel(masterSecret, 'c ap traffic', handshakeHash)
  const serverAppTrafficSecret = cipher.hfkdExpandLabel(masterSecret, 's ap traffic', handshakeHash)

  return {
    clientFinish: cipher.hfkdExtract(handshakeHash, handshakeKey.clientFinishedKey),
    clientAppKey: cipher.hfkdExpandLabel(clientAppTrafficCSecret, 'key', empty, kL),
    clientAppIv: cipher.hfkdExpandLabel(clientAppTrafficCSecret, 'iv', empty, ivL),
    serverAppKey: cipher.hfkdExpandLabel(serverAppTrafficSecret, 'key', empty, kL),
    serverAppIv: cipher.hfkdExpandLabel(serverAppTrafficSecret, 'iv', empty, ivL)
  }
}

export {
  getHandshakeKey,
  getApplicationKey
}
