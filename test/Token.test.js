import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { tokens } from '../utils'
const Token = artifacts.require('Token')

chai.use(chaiAsPromised)
chai.should()

contract('Token', (accounts) => {
  const name = 'My Token'
  const symbol = 'MTK'
  const decimals = 18
  const totalSupply = tokens(1000000)

  let token
  beforeEach(async () => {
    token = await Token.new()
  })

  describe('Deployment', () => {
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
      _totalSupply.toString().should.equal(totalSupply.toString())
    })

    it('Assigns the total supply to the creator', async () => {
      const totalSupply = await token.totalSupply()
      const creatorBalance = await token.balanceOf(accounts[0])
      creatorBalance.toString().should.equal(totalSupply.toString())
    })
  })

  describe('Sending tokens', () => {
    const from = accounts[0]
    const to = accounts[1]

    let amount, result
    beforeEach(async () => {
      amount = tokens(100)
      result = await token.transfer(to, amount, { from })
    })

    it('Transfers token balances', async () => {
      const fromBalance = await token.balanceOf(from)
      fromBalance.toString().should.equal(tokens(999900).toString())

      const toBalance = await token.balanceOf(to)
      toBalance.toString().should.equal(tokens(100).toString())

      const totalSupply = await token.totalSupply()
      totalSupply.toString().should.equal(tokens(1000000).toString())
    })

    it('Emits a transfer event', async () => {
      const log = result.logs[0]
      log.event.should.equal('Transfer')
      const event = log.args
      event.from.should.equal(from)
      event.to.should.equal(to)
      event.value.toString().should.equal(amount.toString())
    })
  })
})
