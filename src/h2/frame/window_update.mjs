/**********
https://datatracker.ietf.org/doc/html/rfc7540#section-6.9

+-+-------------------------------------------------------------+
|R|              Window Size Increment (31)                     |
+-+-------------------------------------------------------------+

**********/

import { Frame } from './frame.mjs'

class WindowUpdateFrame extends Frame {
  constructor () {
    super()

    this.buffer[3] = 0x08 // type
    this.buffer = Buffer.concat(this.buffer, Buffer.from([0x00, 0x00, 0x00, 0x00]))
  }

  updateSize (size) {
    this.buffer.writeIntBE(size, 4, 4)
  }
}

export default () => new WindowUpdateFrame()
