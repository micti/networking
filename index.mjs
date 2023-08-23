import request from './src/http/request.mjs'

// const requestTo = 'https://tools.scrapfly.io/api/fp/ja3?extended=1'
// const requestTo = 'https://api.publicapis.org/entries'
// const requestTo = 'https://127.0.0.1:8000/a/s/d/d/d'
const requestTo = 'https://vnexpress.net/podcast'
;(async () => {
  const t1 = Date.now()
  console.log('>> start', t1)
  const a = await request(requestTo, {})
  const t2 = Date.now()
  console.log('>> finish', t2)
  console.log('>> In', t2 - t1)
  console.log(a)
  // a.response.forEach(e => console.log(e.toString()))
  // console.log(Buffer.concat(a.response).toString())
  // a.timeTLS.forEach(e => console.log(e))
})()
