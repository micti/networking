import { _h } from '../util.mjs'

class Response {
  constructor (options) {
    this.state = 'empty'
    this.capture = 'main'
    this.data = {
      main: null,
      headers: [],
      data: []
    }
    this.current = []
    this.dataLength = 0
    this.event = {}
    this.event.onHeader = options.onHeader
    this.event.onData = options.onData
    this.event.onDone = options.onDone
    this.event.onMain = options.onMain
    this.time = 0
  }

  onMain () {
    if (!this.data.main) {
      throw new Error('HTTP Response Error')
    }

    if (!this.data.main.startsWith('HTTP/1.1 ')) {
      throw new Error('HTTP Response Error')
    }

    const text = this.data.main.replace('HTTP/1.1 ', '')

    if (text[3] !== ' ' && text[3] !== '\t') {
      throw new Error('HTTP Response Error')
    }

    const [statusCodeText, statusText] = text.split(text[3])

    const statusCode = parseInt(statusCodeText, 10)

    if (statusCode.toString() !== statusCodeText) {
      throw new Error('HTTP Response Error')
    }

    this.event.onMain && this.event.onMain(statusCode, statusText)
  }

  onHeader () {
    const headers = {}
    this.data.headers.forEach(header => {
      const [name, value] = header.split(':').map(e => e.trimEnd()).map(e => e.trimStart())
      headers[name] = value
    })

    let length = -1

    if (headers['Content-Lenght']) {
      length = parseInt(headers['Content-Lenght'])
    }

    if (headers['Transfer-Encoding']) {
      if (headers['Transfer-Encoding'].includes('chunked')) {
        length = 0
      }
    }

    if (this.event.onHeader) {
      this.event.onHeader(headers)
    }

    return length
  }

  onDone () {
    if (this.event.onDone) {
      this.event.onDone(this.time)
    }
  }

  addInfo () {
    if (this.capture === 'main') {
      this.data.main = Buffer.from(this.current).toString('ascii')
      this.capture = 'header'
      this.state = 'empty'
      this.current.length = 0
      this.onMain()
      return
    }

    if (this.capture === 'header') {
      if (this.current.length === 0) {
        this.capture = 'data'
        this.current.length = 0
        const l = this.onHeader()
        if (l < 0) this.state = 'unknow_data'
        if (l === 0) {
          this.state = 'empty'
          this.capture = 'chunksize'
        }
        if (l > 0) {
          this.state = 'data'
          this.dataLength = l
        }

        return
      }

      this.data.headers.push(Buffer.from(this.current).toString('ascii'))
      this.state = 'empty'
      this.current.length = 0
      return
    }

    if (this.capture === 'chunksize') {
      const chunkInfo = Buffer.from(this.current)
      const firstSpacePos = chunkInfo.indexOf(';')
      const chunkSize = firstSpacePos < 0 ? chunkInfo.length : firstSpacePos
      this.dataLength = parseInt(chunkInfo.subarray(0, chunkSize).toString('ascii'), 16)

      this.state = 'data'
      this.capture = 'chunkdata'

      if (this.dataLength === 0) {
        this.state = 'empty'
        this.capture = 'lastchunkdata'
      }

      this.current.length = 0
      return
    }

    if (this.capture === 'chunkdata') {
      this.state = 'empty'
      this.capture = 'break'
      this.current.length = 0
      return
    }

    if (this.capture === 'lastchunkdata') {
      if (this.current.length > 0) {
        throw new Error('HTTP Message error')
      }
      this.state = 'skip'
      this.capture = 'break'
      this.current.length = 0
      this.onDone()
      return
    }

    if (this.capture === 'break') {
      if (this.current.length > 0) {
        throw new Error('HTTP Message error')
      }

      this.capture = 'chunksize'
      this.state = 'empty'
      // return
    }

    if (this.capture === 'data') {
      this.state = 'skip'
    }
  }

  /**
   * Parse
   * @param {Buffer} data
   */
  parse (data) {
    this.time++
    if (this.state === 'skip') return

    const buffer = data

    let p = 0
    const l = buffer.length

    while (p < l) {
      if (this.state === 'break') {
        if (buffer[p] === 10) {
          this.addInfo()
          p++
          continue
        }

        this.current.push(13)
        this.current.push(buffer[p])
        continue
      }

      if (this.state === 'empty') {
        if (buffer[p] === 13) {
          this.state = 'break'
          p++
          continue
        }

        this.current.push(buffer[p])
        p++
        continue
      }

      if (this.state === 'data') {
        // this.current.push(buffer[p])
        // this.dataLength--

        // if (this.dataLength === 0) {
        //   this.addInfo()
        // }
        // for last chunk
        // console.log(p, l, this.dataLength)
        // if (this.dataLength === 0) {
        //   this.addInfo()
        // }

        if (p + this.dataLength <= l) {
          if (this.event.onData) {
            this.event.onData(buffer.subarray(p, p + this.dataLength))
          }

          p += this.dataLength
          this.addInfo()
          continue
        }

        if (p + this.dataLength > l) {
          if (this.event.onData) {
            this.event.onData(buffer.subarray(p))
          }
          this.dataLength -= (l - p)
          p = l
          continue
        }
      }

      // move all
      if (this.state === 'unknow_data') {
        if (this.event.onData) {
          this.event.onData(buffer.subarray(p))
        }

        p = l
        continue
      }

      console.log('a')
      p++
    }
  }
}

const response = (opts = {}) => new Response(opts)

export {
  response
}
