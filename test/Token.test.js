require('chai').use(require('chai-as-promised')).should()
const Token = artifacts.require('Token')

contract('Token', (accounts) => {
  const name = 'My Token'
  const symbol = 'MTK'
  const decimals = 18
  const totalSupply = '1000000000000000000000000'

  let token
  beforeEach(async () => {
    token = await Token.new()
  })

  describe('deployment', () => {
    it('Tracks the name', async () => {
      const _name = await token.name()
      _name.should.equal(name)
    })

    it('Tracks the symbol', async () => {
      const _symbol = await token.symbol()
      _symbol.should.equal(symbol)
    })

    it('Tracks the decimals', async () => {
      const _decimals = await token.decimals()
      _decimals.toNumber().should.equal(decimals)
    })

    it('Tracks the total supply', async () => {
      const _totalSupply = await token.totalSupply()
      _totalSupply.toString().should.equal(totalSupply)
    })
  })
})
