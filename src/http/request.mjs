import dns from 'dns/promises'

import { messageGet } from './message.mjs'
import { response as httpMessageParser } from './parser.mjs'
import tlsClient from '../tls/tls.mjs'
import firefoxMac115 from '../preset/firefox_mac_115.mjs'

const request = async (url, options) => {
  const { hostname, port, protocol } = new URL(url)

  if (protocol !== 'https:') throw new Error('only https')

  const [host] = await dns.resolve(hostname)
  const request = messageGet(url, firefoxMac115.headers.http1_1)
  let headers
  const data = []
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
    onData: (d) => data.push(d),
    onMain: (code, text) => {
      statusText = text
      statusCode = code
    }
  })

  tlsClient((port || '443'), host, {
    hostname,
    data: [
      Buffer.from(request)
    ],
    onData: (data) => {
      response.parse(data)
    },
    onFinish: () => {
      response.addInfo()
      requestResolve({
        statusCode,
        statusText,
        headers,
        response: Buffer.concat(data).toString('utf-8')
      })
    },
    onError: (error) => {
      console.log(error)
    },
    hello: {
      ciphers: firefoxMac115.ciphers,
      alos: firefoxMac115.alos,
      curves: firefoxMac115.curves
    }
  })

  return result
}

export default request
