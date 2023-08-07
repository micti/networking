import decode from '../src/hpack/decode.mjs'
import { h } from '../util.mjs'

const responseDecode = decode()

console.log(responseDecode.decode(h('4803333032580770726976617465611d4d6f6e2c203231204f637420323031332032303a31333a323120474d546e1768747470733a2f2f7777772e6578616d706c652e636f6d')))
console.log(responseDecode.getTable().items)

console.log(responseDecode.decode(h('4803333037c1c0bf')))
console.log(responseDecode.getTable().items)

console.log(responseDecode.decode(h('88c1611d4d6f6e2c203231204f637420323031332032303a31333a323220474d54c05a04677a69707738666f6f3d4153444a4b48514b425a584f5157454f50495541585157454f49553b206d61782d6167653d333630303b2076657273696f6e3d31')))
console.log(responseDecode.getTable().items)

const responseDecode2 = decode()

console.log(responseDecode2.decode(h('488264025885aec3771a4b6196d07abe941054d444a8200595040b8166e082a62d1bff6e919d29ad171863c78f0b97c8e9ae82ae43d3')))
console.log(responseDecode2.getTable().items)

console.log(responseDecode2.decode(h('4883640effc1c0bf')))
console.log(responseDecode2.getTable().items)

console.log(responseDecode2.decode(h('88c16196d07abe941054d444a8200595040b8166e084a62d1bffc05a839bd9ab77ad94e7821dd7f2e6c7b335dfdfcd5b3960d5af27087f3672c1ab270fb5291f9587316065c003ed4ee5b1063d5007')))
console.log(responseDecode2.getTable().items)
