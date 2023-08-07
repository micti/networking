import { createDecipheriv } from 'node:crypto'

const decrypt = createDecipheriv(
  'aes-256-gcm',
  Buffer.from('5e355eceed4364e95abe8565e6dde4787714657a755609e3a30a34219b7e89d6', 'hex'),
  Buffer.from('4fb6d6efff883f468dc61842', 'hex')
)
decrypt.setAAD(Buffer.from('170303011a', 'hex'))
decrypt.setAuthTag(Buffer.from('27630ca1c5f9fb12255f9cc3f6aa6b16', 'hex'))
const buf1 = decrypt.update('a25a8cc3dc1fd0a297402f447bad4f274bd7a516ffc02f5146009c9f5f6e7f7cdbd4cfc41d75491fc231614a2a42e98007767f3324aa0c48987182f8b424e74833f3df1bbae155a84ca4df6c3ea55c35f04fdb72cbafe4f25ee16becf09740c558149d2d222a277ac91250b012d6457667a6ce865f2812ef9885ed4be8a946d61598d084d9453a3a37c6a17c7596210edf96850c2d2a59ef6e5f90541a63f17a168c69e4cb4bd7cd45e7f5c88888fca4f9a215877c927750587b59186fff1e488b803d8887cf0f5bf2f6f643e593b08bce48ecc725d4b38d5b0d3066c74cb31986abaa329ced33d57e97c4b8d6d85c876d637c6bfc7395cf9daaaf8dcc3f27157ca55aef29e883e2ee45', 'hex')
const buf2 = decrypt.final()

console.log(buf1)
console.log(buf2)
