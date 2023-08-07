/**********
https://datatracker.ietf.org/doc/html/rfc7540#section-6.5

+---------------+
|Pad Length? (8)|
+-+-------------+-----------------------------------------------+
|E|                 Stream Dependency? (31)                     |
+-+-------------+-----------------------------------------------+
|  Weight? (8)  |
+-+-------------+-----------------------------------------------+
|                   Header Block Fragment (*)                 ...
+---------------------------------------------------------------+
|                           Padding (*)                       ...
+---------------------------------------------------------------+

**********/

import { Frame } from './frame.mjs'

class HeaderFrame extends Frame {
  constructor () {
    super()

    this.buffer[3] = 0x01 // type
    this.block = Buffer.from('')
  }

  setContent (content) {
    this.block = content

    return this.setLength()
  }

  setLength () {
    const length = this.block.length
    this.buffer.writeIntBE(length, 0, 3)

    return this
  }

  getFrame () {
    return Buffer.concat([this.buffer, this.block])
  }
}

export default () => new HeaderFrame()
