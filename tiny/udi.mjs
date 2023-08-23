import { request } from 'undici'

console.log(Date.now())
const {
  statusCode,
  headers,
  trailers,
  body
} = await request('https://api.publicapis.org/entries')

console.log(Date.now())
console.log('response received', statusCode)
console.log('headers', headers)

console.log(Date.now())
for await (const data of body) {
  console.log('data', data)
}

console.log('trailers', trailers)
console.log(Date.now())
