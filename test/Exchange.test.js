/* eslint-disable no-undef */
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { ether, ETHER_ADDRESS, EVMThrow, tokens } from '../utils'
const Token = artifacts.require('Token')
const Exchange = artifacts.require('Exchange')

chai.use(chaiAsPromised)
chai.should()

contract('Exchange', (accounts) => {
  const deployer = accounts[0]
  const feeAccount = accounts[1]
  const user1 = accounts[2]
  const feePercent = 10

  let exchange, token
  beforeEach(async () => {
    token = await Token.new()
    token.transfer(user1, tokens(1000), { from: deployer })
    exchange = await Exchange.new(feeAccount, feePercent)
  })

  describe('Deployment', () => {
    it('Tracks the fee account', async () => {
      const _feeAccount = await exchange.feeAccount()
      _feeAccount.should.equal(feeAccount)
    })

    it('Tracks the fee rate', async () => {
      const _feeRate = await exchange.feeRate()
      _feeRate.toNumber().should.equal(feePercent)
    })
  })

  describe('Fallback', () => {
    it('Rejects when Ether is sent', async () => {
      await exchange
        .sendTransaction({ value: ether(1), from: user1 })
        .should.be.rejectedWith(EVMThrow)
    })
  })

  describe('Depositing Ether', () => {
    const amount = ether(1)

    describe('Successful deposit', () => {
      let result
      beforeEach(async () => {
        result = await exchange.depositEther({ from: user1, value: amount })
      })

      it('Track the ether balance', async () => {
        const balance = await exchange.tokens(ETHER_ADDRESS, user1)
        balance.toString().should.equal(amount.toString())
      })

      it('Emits a Deposit event', async () => {
        const log = result.logs[0]
        log.event.should.equal('Deposit')
        const event = log.args
        event.token.should.equal(ETHER_ADDRESS)
        event.user.should.equal(user1)
        event.amount.toString().should.equal(amount.toString())
        event.balance.toString().should.equal(amount.toString())
      })
    })
  })

  describe('Withdrawing Ether', () => {
    let result, amount
    beforeEach(async () => {
      amount = ether(1)
      await exchange.depositEther({ from: user1, value: amount })
    })
    describe('Successful withdrawal', () => {
      beforeEach(async () => {
        result = await exchange.withdrawEther(amount, { from: user1 })
      })

      it('Withdraws the ether', async () => {
        const balance = await exchange.tokens(ETHER_ADDRESS, user1)
        balance.toString().should.equal('0')
      })

      it('Emits a Withdraw event', async () => {
        const log = result.logs[0]
        log.event.should.equal('Withdraw')
        const event = log.args
        event.token.should.equal(ETHER_ADDRESS)
        event.user.should.equal(user1)
        event.amount.toString().should.equal(amount.toString())
        event.balance.toString().should.equal('0')
      })
    })

    describe('Failing withdrawal', () => {
      it('Rejects when there is insufficient balance', async () => {
        await exchange
          .withdrawEther(ether(2), { from: user1 })
          .should.be.rejectedWith(EVMThrow)
      })
    })
  })

  describe('Depositing tokens', () => {
    describe('Successful transfer', () => {
      let amount, result
      beforeEach(async () => {
        amount = tokens(100)
        await token.approve(exchange.address, amount, { from: user1 })
        result = await exchange.depositToken(token.address, amount, {
          from: user1,
        })
      })

      it('Tracks the token deposit', async () => {
        // Check exchange token balance
        const userBalance = await token.balanceOf(exchange.address)
        userBalance.toString().should.equal(amount.toString())

        // Check tokens on the exchange
        const user1Balance = await exchange.tokens(token.address, user1)
        user1Balance.toString().should.equal(amount.toString())
      })

      it('Emits a Deposit event', async () => {
        const log = result.logs[0]
        log.event.should.equal('Deposit')
        const event = log.args
        event.token.should.equal(token.address)
        event.user.should.equal(user1)
        event.amount.toString().should.equal(amount.toString())
        event.balance.toString().should.equal(amount.toString())
      })
    })

    describe('Failed transfer', () => {
      it('Rejects Ether deposits', async () => {
        await exchange
          .depositToken(ETHER_ADDRESS, tokens(100), { from: user1 })
          .should.be.rejectedWith(EVMThrow)
      })

      it('Rejects when no tokens are approved', async () => {
        await exchange
          .depositToken(token.address, tokens(100), { from: user1 })
          .should.be.rejectedWith(EVMThrow)
      })
    })
  })

  describe('Withdrawing tokens', () => {
    let amount
    beforeEach(async () => {
      amount = tokens(100)
      await token.approve(exchange.address, amount, { from: user1 })
      await exchange.depositToken(token.address, amount, { from: user1 })
    })

    describe('Successful withdrawal', () => {
      let result
      beforeEach(async () => {
        result = await exchange.withdrawToken(token.address, amount, {
          from: user1,
        })
      })

      it('Withdraws the tokens', async () => {
        const userBalance = await token.balanceOf(exchange.address)
        userBalance.toString().should.equal('0')

        const user1Balance = await exchange.tokens(token.address, user1)
        user1Balance.toString().should.equal('0')
      })

      it('Emits a Withdraw event', async () => {
        const log = result.logs[0]
        log.event.should.equal('Withdraw')
        const event = log.args
        event.token.should.equal(token.address)
        event.user.should.equal(user1)
        event.amount.toString().should.equal(amount.toString())
        event.balance.toString().should.equal('0')
      })
    })

    describe('Failing withdrawal', () => {
      it('Rejects Ether withdrawals', async () => {
        await exchange
          .withdrawToken(ETHER_ADDRESS, tokens(100), { from: user1 })
          .should.be.rejectedWith(EVMThrow)
      })

      it('Rejects when there is insufficient balance', async () => {
        await exchange
          .withdrawToken(token.address, tokens(101), { from: user1 })
          .should.be.rejectedWith(EVMThrow)
      })
    })
  })

  describe('Checking balances', () => {
    beforeEach(async () => {
      await exchange.depositEther({ from: user1, value: ether(1) })
    })

    it('Returns the balance of an account', async () => {
      const balance = await exchange.balanceOf(ETHER_ADDRESS, user1)
      balance.toString().should.equal(ether(1).toString())
    })
  })
})
