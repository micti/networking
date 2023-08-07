export const messageGet = (url, headers) => {
  const parsedUrl = url instanceof URL ? url : new URL(url)

  let message = `GET ${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash} HTTP/1.1`
  const finalHeaders = {
    Host: parsedUrl.host,
    ...headers
  }

  delete finalHeaders['Content-Length']

  message += '\r\n'
  message += Object.keys(finalHeaders).map(key => `${key}: ${finalHeaders[key]}`).join('\r\n')
  message += '\r\n\r\n'

  return message
}
