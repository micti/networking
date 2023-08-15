import net from 'node:net'
import { randomBytes } from 'crypto'

import * as curve25519 from 'curve25519-js'

import { clientBuilder } from './builder.mjs'
import { serverParser } from './parser.mjs'
import cipher from './cipher.mjs'
import { getApplicationKey, getHandshakeKey } from './key.mjs'
import { _h } from '../util.mjs'

class TlsClient {
  constructor (socket, options) {
    this.info = {
      state: 'clientHello',
      handshakeData: [],
      finish: null,
      clientExchangeKey: {
        private: null,
        public: null
      },
      serverExchangeKey: {
        public: null
      },
      handshakeKey: null,
      applicationKey: null,
      cipher: null,
      // port,
      // host
    }

    this.options = {
      ...options
    }

    const clientKeyPair = curve25519.generateKeyPair(randomBytes(32))

    this.info.clientExchangeKey.private = Buffer.from(clientKeyPair.private)
    this.info.clientExchangeKey.public = Buffer.from(clientKeyPair.public)

    this.socket = socket
    this.socket.onReceive = this.onReceive.bind(this)
    this.clientBuilder = clientBuilder(this)
    this.serverParser = serverParser(this)
  }

  getCipher () {
    return this.info.cipher
  }

  // connect () {
  //   console.log('>> start tls', Date.now())
  //   this.socket = net.createConnection(this.info.port, this.info.host, () => {
  //     this.socket.on('data', (d) => this.onReceive(d))
  //     console.log('>> connected tls', Date.now())
  //     this.onConnect()
  //   })
  // }

  onConnect () {
    const clientHello = this.clientBuilder.clientHello(this.options.hello.ciphers, {
      extensions: {
        server_name: this.options.hostname,
        extend_master_secret: true,
        renegotiation_info: null,
        ec_points: ['00'],
        session_ticket: null,
        alpn: ['http1.1'],
        status_request: '01',
        delegated_credentials: ['0403', '0503', '0603', '0203'],
        key_share: {
          '001d': _h(this.info.clientExchangeKey.public)
        },
        supported_versions: true,
        signature_algorithms: this.options.hello.alos,
        supported_groups: this.options.hello.curves,
        psk_key_exchange_modes: ['01'],
        record_size_limit: 16385,
        padding: false
      }
    })

    this.info.handshakeData.push(clientHello.subarray(5))
    this.send(clientHello)
    this.info.state = 'client_sent'
  }

  send (data) {
    return this.socket.write(data)
  }

  onReceive (data) {
    this.serverParser.parse(data)
  }

  onReceiveHandshakeRecord (data) {
    this.info.handshakeData.push(data)
  }

  onReceiveServerHello (info) {
    this.info.cipher = cipher(info.cipherSuite)
    this.info.serverExchangeKey.public = info.extensions['0033'].key
    this.info.handshakeKey = getHandshakeKey(this.info.handshakeData, this.info.clientExchangeKey.private, this.info.serverExchangeKey.public, this.info.cipher)
    this.info.cipher.setDecryptKeyAndIv(this.info.handshakeKey.serverHandshakeKey, this.info.handshakeKey.serverHandshakeIv)
    this.info.cipher.setEncryptKeyAndIv(this.info.handshakeKey.clientHandshakeKey, this.info.handshakeKey.clientHandshakeIv)
    this.info.state = 'server_end_handshake'
  }

  onServerEndHandshake (info) {
    this.info.applicationKey = getApplicationKey(this.info.handshakeData, this.info.handshakeKey, this.info.cipher)
    this.info.cipher.setDecryptKeyAndIv(this.info.applicationKey.serverAppKey, this.info.applicationKey.serverAppIv)
    this.serverParser.setSeq(0)

    this.send(Buffer.concat([
      this.clientBuilder.changeCipher(),
      this.clientBuilder.handshakeRecord(
        this.clientBuilder.handshake(
          Buffer.from('14', 'hex'),
          this.info.applicationKey.clientFinish
        )
      )
    ]))

    this.info.state = 'client_end_handshake'
    this.onClienEndHandshake()
  }

  onClienEndHandshake () {
    console.log('>> end setup tls', Date.now())
    this.info.cipher.setEncryptKeyAndIv(this.info.applicationKey.clientAppKey, this.info.applicationKey.clientAppIv)
    this.clientBuilder.setSeq(0)
    this.options.data.forEach(d => {
      this.send(this.clientBuilder.applicationRecord(d))
    })
    console.log('>> end request tls', Date.now())
    this.info.state = 'client_application_send'
  }

  onServerApplication (data) {
    this.info.state = 'client_application_receive'
    this.options.onData(data)
  }

  onFinish () {
    if (this.options.onFinish) {
      this.options.onFinish()
    }
  }

  onError (data) {
    this.socket.destroy()
    const error = new Error('TLS error: ' + data.description)

    if (this.options.onError) {
      this.options.onError(error)
      return
    }

    throw new Error('TLS error: ' + data.description)
  }
}

export default (port, host, opts) => new TlsClient(port, host, opts)
