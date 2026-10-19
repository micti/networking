const TYPE = '0023'

// nothing now
const build = (session) => {
  const buffer = Buffer.from([0, 35, 0, 0])
  // no session
  return buffer
}

export default {
  // parse,
  build,
  TYPE
}
