// HandshakeType;
// hello_request_RESERVED(0),
// client_hello(1),
// server_hello(2),
// hello_verify_request_RESERVED(3),
// new_session_ticket(4),
// end_of_early_data(5),
// hello_retry_request_RESERVED(6),
// encrypted_extensions(8),
// certificate(11),
// server_key_exchange_RESERVED(12),
// certificate_request(13),
// server_hello_done_RESERVED(14),
// certificate_verify(15),
// client_key_exchange_RESERVED(16),
// finished(20),
// certificate_url_RESERVED(21),
// certificate_status_RESERVED(22),
// supplemental_data_RESERVED(23),
// key_update(24),
// message_hash(254),

import ServerHelloRecord from './record/server_hello.mjs'
import ErrorRecord from './record/error.mjs'
import { _h, copy } from '../util.mjs'

// struct {
//   HandshakeType msg_type;    /* handshake type */
//   uint24 length;             /* bytes in message */
//   select (Handshake.msg_type) {
//       case client_hello:          ClientHello;
//       case server_hello:          ServerHello;
//       case end_of_early_data:     EndOfEarlyData;
//       case encrypted_extensions:  EncryptedExtensions;
//       case certificate_request:   CertificateRequest;
//       case certificate:           Certificate;
//       case certificate_verify:    CertificateVerify;
//       case finished:              Finished;
//       case new_session_ticket:    NewSessionTicket;
//       case key_update:            KeyUpdate;
//   };
// } Handshake;

// enum {
//   server_name(0),                             /* RFC 6066 */
//   max_fragment_length(1),                     /* RFC 6066 */
//   status_request(5),                          /* RFC 6066 */
//   supported_groups(10),                       /* RFC 8422, 7919 */
//   signature_algorithms(13),                   /* RFC 8446 */
//   use_srtp(14),                               /* RFC 5764 */
//   heartbeat(15),                              /* RFC 6520 */
//   application_layer_protocol_negotiation(16), /* RFC 7301 */
//   signed_certificate_timestamp(18),           /* RFC 6962 */
//   client_certificate_type(19),                /* RFC 7250 */
//   server_certificate_type(20),                /* RFC 7250 */
//   padding(21),                                /* RFC 7685 */
//   RESERVED(40),                               /* Used but never
//                                                  assigned */
//   pre_shared_key(41),                         /* RFC 8446 */
//   early_data(42),                             /* RFC 8446 */
//   supported_versions(43),                     /* RFC 8446 */
//   cookie(44),                                 /* RFC 8446 */
//   psk_key_exchange_modes(45),                 /* RFC 8446 */
//   RESERVED(46),                               /* Used but never
//                                                  assigned */
//   certificate_authorities(47),                /* RFC 8446 */
//   oid_filters(48),                            /* RFC 8446 */
//   post_handshake_auth(49),                    /* RFC 8446 */
//   signature_algorithms_cert(50),              /* RFC 8446 */
//   key_share(51),                              /* RFC 8446 */
//   (65535)
// } ExtensionType;

const RECORD_TYPES = {
  HANDSHAKE: '16',
  APPLICATION_DATA: '17',
  ERROR: '15'
}

const HANDSHAKE_TYPES = {
  SERVER_HELLO: '02',
  NEW_SESSION_TICKET: '04',
  ENCRYPTED_EXTENSIONS: '08',
  CERTIFICATE: '0b',
  CERTIFICATE_VERIFY: '0f',
  FINISH: '14',
  ALPN: '10'
}

class ServerParser {
  constructor (tls) {
    this.tls = tls
    this.seq = 0
    this.prev = null
  }

  setSeq (seq = 0) {
    this.seq = seq
  }

  /**
   *
   * @param {Buffer} data
   */
  parse (data) {
    if (this.prev) data = Buffer.concat([this.prev, data])

    let p = 0
    let r = []

    while (p < data.length) {
      const type = _h(data.subarray(p, p + 1))
      // const legacyVersion = _h(data.subarray(p + 1, p + 3))
      const length = data.readIntBE(p + 3, 2)

      if (data.length < p + 5 + length) {
        break
      }

      if (type === RECORD_TYPES.HANDSHAKE) {
        r = [
          ...r,
          ...this.parseHandShake(data.subarray(p + 5, p + 5 + length))
        ]

        p += 5 + length
        continue
      }

      if (type === RECORD_TYPES.APPLICATION_DATA) {
        const record = this.tls.getCipher().decryptRecord(data.subarray(p, p + 5 + length), this.seq)
        this.seq++

        if (_h(record.subarray(record.length - 1)) === '16') {
          r = [
            ...r,
            ...this.parseHandShake(record.subarray(0, record.length - 1))
          ]
        }

        if (_h(record.subarray(record.length - 1)) === '17') {
          r.push({
            hs: false,
            type: RECORD_TYPES.APPLICATION_DATA,
            data: _h(record.subarray(0, record.length - 1))
          })
          this.tls.onServerApplication(copy(record.subarray(0, record.length - 1)))
        }

        if (_h(record.subarray(record.length - 1)) === '15') {
          r.push({
            hs: false,
            type: RECORD_TYPES.ERROR,
            data: _h(record.subarray(0, record.length - 1))
          })

          const errorData = ErrorRecord.parse(record.subarray(0, record.length - 1))
          if (errorData.level === 1 && errorData.code === 0) {
            this.tls.onFinish()
            return
          }

          this.tls.onError(errorData)
        }

        p += 5 + length
        continue
      }

      if (type === RECORD_TYPES.ERROR) {
        r.push({
          hs: false,
          type: RECORD_TYPES.ERROR,
          data: _h(data.subarray(p + 5, p + 5 + length))
        })

        const errorData = ErrorRecord.parse(data.subarray(p + 5, p + 5 + length))
        if (errorData.level === 1 && errorData.code === 0) {
          this.tls.onFinish()
          return
        }

        this.tls.onError(errorData)
        return r
      }

      // SKIP parser
      r.push({ type })
      p += 5 + length
    }

    this.prev = p < data.length ? data.subarray(p) : null

    return r
  }

  /**
   *
   * @param {Buffer} data
   * @returns
   */
  parseHandShake (data) {
    let p = 0
    const info = []

    while (p < data.length) {
      const type = _h(data.subarray(p, p + 1))
      const length = data.readIntBE(p + 1, 3)

      // if (data.length  4 + length) throw new Error('tls_parse handshake')

      if (type === ServerHelloRecord.TYPE) {
        const rh = ServerHelloRecord.parse(data.subarray(p + 4, p + 4 + length))
        rh.name = 'handshake'
        rh.type = RECORD_TYPES.HANDSHAKE

        this.tls.onReceiveHandshakeRecord(data.subarray(p, p + 4 + length))
        this.tls.onReceiveServerHello(rh)
        this.seq = 0

        p += 4 + length
        info.push(rh)
        continue
      }

      if ([
        HANDSHAKE_TYPES.ENCRYPTED_EXTENSIONS,
        HANDSHAKE_TYPES.CERTIFICATE,
        HANDSHAKE_TYPES.CERTIFICATE_VERIFY
        // HANDSHAKE_TYPES.ALPN
      ].includes(type)) {
        const rh = {
          name: 'handshake',
          type: RECORD_TYPES.HANDSHAKE,
          hs_type: type,
          hs_name: type
        }

        // skip
        rh.data = _h(data.subarray(p + 4, p + 4 + length))

        // EVENT
        this.tls.onReceiveHandshakeRecord(data.subarray(p, p + 4 + length))

        p += 4 + length
        info.push(rh)
        continue
      }

      if (type === HANDSHAKE_TYPES.NEW_SESSION_TICKET) {
        const rh = {
          name: 'handshake',
          type: RECORD_TYPES.HANDSHAKE,
          hs_type: type,
          hs_name: 'new_session_ticket'
        }

        rh.data = _h(data.subarray(p + 4, p + 4 + length))

        p += 4 + length
        info.push(rh)
        continue
      }

      if (type === HANDSHAKE_TYPES.FINISH) {
        const rh = {
          name: 'handshake',
          type: RECORD_TYPES.HANDSHAKE,
          hs_type: type,
          hs_name: 'finish'
        }

        rh.verify = copy(data.subarray(p + 4, p + 4 + length))

        // EVENT
        this.tls.onReceiveHandshakeRecord(data.subarray(p, p + 4 + length))
        this.tls.onServerEndHandshake(rh)

        p += p + 4 + length
        info.push(rh)
        continue
      }

      // SKIP parser
      const rh = {
        name: 'handshake',
        type: RECORD_TYPES.HANDSHAKE,
        hs_type: type,
        hs_name: type,
        data: _h(data.subarray(p + 4, p + 4 + length))
      }

      p += 4 + length
      info.push(rh)
    }

    return info
  }
}

export const serverParser = (tls) => new ServerParser(tls)
