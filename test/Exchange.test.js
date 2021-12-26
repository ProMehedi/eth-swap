import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { EVMThrow, tokens } from '../utils'
const Exchange = artifacts.require('Exchange')

chai.use(chaiAsPromised)
chai.should()

contract('Exchange', (accounts) => {
  const deployer = accounts[0]
  const feeAccount = accounts[1]
  const feePercent = 10

  let exchange
  beforeEach(async () => {
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
})
