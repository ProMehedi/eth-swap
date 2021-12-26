import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { EVMThrow, tokens } from '../utils'
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
    describe('Successful transfer', () => {
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

    describe('Failed transfer', () => {
      it('Rejects insufficient balances', async () => {
        let inValidAmount = tokens(10000000)
        await token
          .transfer(to, inValidAmount, { from })
          .should.be.rejectedWith(EVMThrow)

        inValidAmount = tokens(100)
        await token
          .transfer(from, inValidAmount, { from: to })
          .should.be.rejectedWith(EVMThrow)
      })

      it('Rejects invalid address', async () => {
        await token.transfer(0x0, amount, { from }).should.be.rejected
      })
    })
  })

  describe('Approving tokens', () => {
    const from = accounts[0]
    const spender = accounts[2]

    let amount, result
    beforeEach(async () => {
      amount = tokens(100)
      result = await token.approve(spender, amount, { from })
    })

    describe('Successful approval', () => {
      it('Allocates an allowance for delegated token spending on exchange', async () => {
        const allowance = await token.allowance(from, spender)
        allowance.toString().should.equal(amount.toString())
      })

      it('Emits an approval event', async () => {
        const log = result.logs[0]
        log.event.should.equal('Approval')
        const event = log.args
        event.owner.should.equal(from)
        event.spender.should.equal(spender)
        event.value.toString().should.equal(amount.toString())
      })
    })

    describe('Failed approval', () => {
      it('Rejects insufficient balances', async () => {
        await token
          .approve(spender, tokens(10000000), { from })
          .should.be.rejectedWith(EVMThrow)
      })

      it('Rejects invalid address', async () => {
        await token.approve(0x0, amount, { from }).should.be.rejected
      })
    })
  })

  describe('Transfer from', () => {
    const from = accounts[0]
    const to = accounts[1]
    const spender = accounts[2]

    let amount, result
    beforeEach(async () => {
      amount = tokens(100)
      await token.approve(spender, amount, { from })
    })

    describe('Successful transfer', () => {
      beforeEach(async () => {
        result = await token.transferFrom(from, to, amount, { from: spender })
      })

      it('Transfers token balances', async () => {
        const fromBalance = await token.balanceOf(from)
        fromBalance.toString().should.equal(tokens(999900).toString())

        const toBalance = await token.balanceOf(to)
        toBalance.toString().should.equal(tokens(100).toString())

        const totalSupply = await token.totalSupply()
        totalSupply.toString().should.equal(tokens(1000000).toString())
      })

      it('Resets the allowance', async () => {
        const allowance = await token.allowance(from, spender)
        allowance.toString().should.equal('0')
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
})
