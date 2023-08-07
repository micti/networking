const TYPE = '14'
const build = () => Buffer.from([20, 3, 3, 0, 1, 1])
const parse = (_) => ({
  hs_name: 'change_cipher',
  hs_type: TYPE
})

export default {
  build,
  parse,
  TYPE
}
