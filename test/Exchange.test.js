/* eslint-disable no-undef */
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { EVMThrow, tokens } from '../utils'
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

  describe('Depositing tokens', () => {
    const from = accounts[0]
    const to = accounts[1]

    let amount, result
    describe('Successful transfer', () => {
      let result
      beforeEach(async () => {
        amount = tokens(100)
        await token.approve(exchange.address, amount, { from: user1 })
        result = await exchange.depositToken(token.address, amount, {
          from: user1,
        })
      })

      it('Tracks the token deposit', async () => {
        const userBalance = await token.balanceOf(exchange.address)
        userBalance.toString().should.equal(amount.toString())
      })
    })
  })
})
