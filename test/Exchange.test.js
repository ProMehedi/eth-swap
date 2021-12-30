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
  const user2 = accounts[3]
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

  describe('Making orders', () => {
    const amount = ether(1)

    let result
    beforeEach(async () => {
      result = await exchange.makeOrder(
        token.address,
        amount,
        ETHER_ADDRESS,
        amount,
        { from: user1 }
      )
    })

    it('Tracks the order', async () => {
      const orderCount = await exchange.orderCount()
      orderCount.toString().should.equal('1')
      const order = await exchange.orders('1')
      order.id.toString().should.equal('1')
      order.user.should.equal(user1)
      order.tokenGet.should.equal(token.address)
      order.amountGet.toString().should.equal(amount.toString())
      order.tokenGive.should.equal(ETHER_ADDRESS)
      order.amountGive.toString().should.equal(amount.toString())
      order.timestamp.toString().length.should.be.at.least(1)
    })

    it('Emits an Order event', async () => {
      const log = result.logs[0]
      log.event.should.equal('Order')
      const event = log.args
      event.id.toString().should.equal('1')
      event.user.should.equal(user1)
      event.tokenGet.should.equal(token.address)
      event.amountGet.toString().should.equal(amount.toString())
      event.tokenGive.should.equal(ETHER_ADDRESS)
      event.amountGive.toString().should.equal(amount.toString())
      event.timestamp.toString().length.should.be.at.least(1)
    })
  })

  describe('Order actions', () => {
    beforeEach(async () => {
      // user1 deposits ether only
      await exchange.depositEther({ from: user1, value: ether(1) })
      // give tokens to user2
      await token.transfer(user2, tokens(100), { from: deployer })
      // user2 deposits tokens
      await token.approve(exchange.address, tokens(2), { from: user2 })
      await exchange.depositToken(token.address, tokens(2), { from: user2 })
      // user1 makes an order to buy tokens with ether
      await exchange.makeOrder(
        token.address,
        tokens(1),
        ETHER_ADDRESS,
        ether(1),
        { from: user1 }
      )
    })

    describe('Filling orders', () => {
      describe('Successful fill', () => {
        let result
        beforeEach(async () => {
          // user2 fills the order
          result = await exchange.fillOrder('1', { from: user2 })
        })

        it('Executes the order & charges fees', async () => {
          let balance
          balance = await exchange.balanceOf(token.address, user1)
          balance.toString().should.equal(tokens(1).toString())
          balance = await exchange.balanceOf(ETHER_ADDRESS, user2)
          balance.toString().should.equal(ether(1).toString())
          balance = await exchange.balanceOf(ETHER_ADDRESS, user1)
          balance.toString().should.equal('0')
          balance = await exchange.balanceOf(token.address, user2)
          balance.toString().should.equal(tokens(0.9).toString())
          const _feeAccount = await exchange.feeAccount()
          balance = await exchange.balanceOf(token.address, _feeAccount)
          balance.toString().should.equal(tokens(0.1).toString())
        })

        it('Updates filled orders', async () => {
          const orderFilled = await exchange.orderFilled('1')
          orderFilled.should.equal(true)
        })

        it('Emits a Trade event', async () => {
          const log = result.logs[0]
          log.event.should.equal('Trade')
          const event = log.args
          event.id.toString().should.equal('1')
          event.user.should.equal(user1)
          event.tokenGet.should.equal(token.address)
          event.amountGet.toString().should.equal(tokens(1).toString())
          event.tokenGive.should.equal(ETHER_ADDRESS)
          event.amountGive.toString().should.equal(ether(1).toString())
          event.userFill.should.equal(user2)
          event.timestamp.toString().length.should.be.at.least(1)
        })
      })

      describe('Failing fill', () => {
        it('Rejects invalid order ids', async () => {
          await exchange
            .fillOrder('0', { from: user2 })
            .should.be.rejectedWith(EVMThrow)
        })

        it('Rejects already-filled orders', async () => {
          await exchange.fillOrder('1', { from: user2 }).should.be.fulfilled
          await exchange
            .fillOrder('1', { from: user2 })
            .should.be.rejectedWith(EVMThrow)
        })

        it('Rejects cancelled orders', async () => {
          await exchange.cancelOrder('1', { from: user1 }).should.be.fulfilled
          await exchange
            .fillOrder('1', { from: user2 })
            .should.be.rejectedWith(EVMThrow)
        })
      })
    })

    describe('Cancelling orders', () => {
      describe('Successful cancellation', () => {
        let result, amount
        beforeEach(async () => {
          amount = ether(1)
          result = await exchange.cancelOrder('1', { from: user1 })
        })

        it('Updates the order', async () => {
          const orderCancelled = await exchange.orderCancelled('1')
          orderCancelled.should.equal(true)
        })

        it('Emits a Cancel event', async () => {
          const log = result.logs[0]
          log.event.should.equal('Cancel')
          const event = log.args
          event.id.toString().should.equal('1')
          event.user.should.equal(user1)
          event.tokenGet.should.equal(token.address)
          event.amountGet.toString().should.equal(amount.toString())
          event.tokenGive.should.equal(ETHER_ADDRESS)
          event.amountGive.toString().should.equal(amount.toString())
          event.timestamp.toString().length.should.be.at.least(1)
        })
      })

      describe('Failing cancellation', () => {
        it('Rejects invalid order ids', async () => {
          await exchange
            .cancelOrder('2', { from: user1 })
            .should.be.rejectedWith(EVMThrow)
        })

        it('Rejects when order is already cancelled', async () => {
          await exchange.cancelOrder('1', { from: user1 })
          await exchange
            .cancelOrder('1', { from: user1 })
            .should.be.rejectedWith(EVMThrow)
        })

        it('Rejects unauthorized cancellations', async () => {
          await exchange
            .cancelOrder('1', { from: accounts[1] })
            .should.be.rejectedWith(EVMThrow)
        })
      })
    })
  })
})
