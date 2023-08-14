import https from 'https';

console.log('s', Date.now())
https.get('https://api.publicapis.org/entries', (res) => {
  const data = []
  console.log('>', Date.now())
  res.on('data', d => data.push(d))
  res.on('end', () => {
    // Buffer.concat(data).toString('utf-8')
    console.log('>', Date.now())
    data.forEach(e => console.log(e));
  })
})
