import { _h, copy } from '../../util.mjs'
import { type as EXTENSION_TYPES, parse as extensions } from './extension/index.mjs'

const TYPE = '02'

const parseHandShakeExtensions = (data) => {
  let p = 0
  const extensionData = {}

  while (p < data.length) {
    const type = _h(data.subarray(p, p + 2))
    const length = data.readIntBE(p + 2, 2)

    if (data.length < p + 4 + length) throw new Error('tls_parse handshake hello extenstion')

    if (type === EXTENSION_TYPES.SUPPORTED_VERSIONS) {
      extensionData[type] = extensions.supported_versions(data.subarray(p + 4, p + 4 + length))

      p += 4 + length
      continue
    }

    if (type === EXTENSION_TYPES.KEY_SHARE) {
      extensionData[type] = extensions.key_share(data.subarray(p + 4, p + 4 + length))

      p += 4 + length
      continue
    }

    // SKIP
    extensionData[type] = {
      data: copy(data.subarray(p + 4, p + 4 + length))
    }
    p += 4 + length
  }

  return extensionData
}

const parse = (data) => {
  const record = {
    hs_name: 'server_hello',
    hs_type: TYPE
  }

  record.legacyVersion = _h(data.subarray(0, 2))
  record.random = copy(data.subarray(2, 34))

  const sessionLength = data.readIntBE(34, 1)
  record.legacySessionId = copy(data.subarray(35, 35 + sessionLength))

  record.cipherSuite = _h(data.subarray(sessionLength + 35, sessionLength + 37))
  record.compressMethod = _h(data.subarray(sessionLength + 37, sessionLength + 38))

  const extensionLength = data.readIntBE(sessionLength + 38, 2)
  record.extensions = parseHandShakeExtensions(data.subarray(sessionLength + 40, sessionLength + 40 + extensionLength))

  return record
}

export default {
  parse,
  TYPE
}
