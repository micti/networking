import request from './src/http/request.mjs'

// const requestTo = 'https://tools.scrapfly.io/api/fp/ja3?extended=1'
const requestTo = 'https://api.publicapis.org/entries'

;(async () => {
  const a = await request(requestTo, {})
  console.log(a)
})()
