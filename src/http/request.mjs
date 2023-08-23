import { createGunzip } from 'node:zlib'

import { messageGet } from './message.mjs'
import { response as httpMessageParser } from './parser.mjs'
import tlsClient from '../tls/tls.mjs'
import firefoxMac115 from '../preset/firefox_mac_115.mjs'
import connection from '../net/connection.mjs'

const request = async (url, options) => {
  const { hostname, port, protocol } = new URL(url)

  if (protocol !== 'https:') throw new Error('only https')

  const socket = connection(hostname, port || '443')

  const request = messageGet(url, firefoxMac115.headers.http1_1)
  let headers
  const data = []
  const time = []
  let statusCode
  let statusText
  let requestResolve
  let requestReject
  let encoding = null
  let isFinish = false
  let tls = null
  const result = new Promise((resolve, reject) => {
    requestResolve = resolve
    requestReject = reject
  })

  const finishFn = () => {
    if (isFinish) return

    isFinish = true
    socket.finish()

    requestResolve({
      statusCode,
      statusText,
      headers,
      time,
      timeTLS: tls.time,
      response: data
    })
  }

  const response = httpMessageParser({
    onHeader: (h) => {
      headers = h
      console.log(headers)
      if (headers['Content-Encoding'] === 'gzip') {
        encoding = createGunzip()
        encoding.on('data', d => data.push(d))
        encoding.on('end', finishFn)
      }
    },
    onData: (d) => {
      if (encoding) {
        const a = encoding.write(d)
        console.log(a)
      } else {
        data.push(d)
      }
      time.push(Date.now())
    },
    onMain: (code, text) => {
      statusText = text
      statusCode = code
    },
    onDone: () => {
      if (encoding) {
        encoding.end(null)
        return
      }

      finishFn()
    }
  })

  tls = tlsClient(socket, {
    hostname,
    onData: (data, header) => {
      response.parse(data)
    },
    onFinish: () => {
      finishFn()
    },
    onError: (error) => {
      requestReject(error)
    },
    hello: {
      ciphers: firefoxMac115.ciphers,
      alos: firefoxMac115.alos,
      curves: firefoxMac115.curves
    }
  })

  console.log('connecting...', Date.now())
  await socket.connect()
  console.log('connected', Date.now())
  console.log('tls handshake', Date.now())
  await tls.handshake()
  console.log('tls handshake end', Date.now())
  tls.send(tls.clientBuilder.applicationRecord(Buffer.from(request)), () => {
    console.log('>>> finish request', Date.now())
  })

  return result
}

export default request
