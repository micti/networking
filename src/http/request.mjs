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
  const result = new Promise((resolve, reject) => {
    requestResolve = resolve
    requestReject = reject
  })
  const response = httpMessageParser({
    onHeader: (h) => { headers = h },
    onData: (d) => {
      data.push(d)
      time.push(Date.now())
    },
    onMain: (code, text) => {
      statusText = text
      statusCode = code
    },
    onDone: () => {
      requestResolve({
        statusCode,
        statusText,
        headers,
        time,
        response: data
      })
    }
  })

  const tls = tlsClient(socket, {
    hostname,
    data: [
      Buffer.from(request)
    ],
    onData: (data) => {
      response.parse(data)
    },
    onFinish: () => {
      requestResolve({
        statusCode,
        statusText,
        headers,
        response: Buffer.concat(data).toString('utf-8')
      })
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

  await socket.connect()
  tls.onConnect()

  return result
}

export default request
