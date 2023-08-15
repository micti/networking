import https from 'https';

console.log('s', Date.now())
https.get('https://api.publicapis.org/entries', (res) => {
  const data = []
  const time = []
  console.log('>', Date.now())
  res.on('data', d => {
    data.push(d)
    time.push(Date.now())
  })
  res.on('end', () => {
    // Buffer.concat(data).toString('utf-8')
    console.log('>', Date.now())
    data.forEach(e => console.log(e))
    time.forEach(t => console.log(t))
  })
})
