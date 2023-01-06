const { ethers } = require('hardhat');
const { expect } = require('chai');

describe('Escrow', function () {
  let contract1, contract2;
  let depositor;
  let beneficiary;
  let arbiter;
  const deposit = ethers.utils.parseEther('1');
  beforeEach(async () => {
    depositor = ethers.provider.getSigner(0);
    beneficiary = ethers.provider.getSigner(1);
    arbiter = ethers.provider.getSigner(2);
    const Escrow = await ethers.getContractFactory('Escrow');
    contract1 = await Escrow.deploy(
      arbiter.getAddress(),
      beneficiary.getAddress(),
      0,
      {
        value: deposit,
      }
    );
    contract2 = await Escrow.deploy(
      arbiter.getAddress(),
      beneficiary.getAddress(),
      100,
      {
        value: deposit,
      }
    );
    await contract1.deployed();
    await contract2.deployed();
  });

  it('should be funded initially', async function () {
    let balance = await ethers.provider.getBalance(contract1.address);
    expect(balance).to.eq(deposit);
  });

  describe('after approval from address other than the arbiter', () => {
    it('should revert', async () => {
      await expect(contract1.connect(beneficiary).approve()).to.be.reverted;
    });
  });

  describe('after approval from the arbiter', () => {
    it('should transfer balance to beneficiary', async () => {
      const before = await ethers.provider.getBalance(beneficiary.getAddress());
      const approveTxn = await contract1.connect(arbiter).approve();
      await approveTxn.wait();
      const after = await ethers.provider.getBalance(beneficiary.getAddress());
      expect(after.sub(before)).to.eq(deposit);
    });
  });

  describe("after validate is called the flag shoudn't be set as expired if expiry 0", () => {
    it('should not expire', async () => {
      await contract1.validate();
      expect(await contract1.isExpired()).eq(false);
    });
  });

  describe("after validate is called the flag shoudn't be set as expired if expiry not 0 and time hasn't passed ", () => {
    it('should not expire', async () => {
      await new Promise((r) => setTimeout(r, 50));

      await contract2.validate();
      expect(await contract1.isExpired()).eq(false);
    });
  });

  describe("after validate is called the flag should set to be expired if time passed ", () => {
    it('should expire', async () => {
      await new Promise((r) => setTimeout(r, 110));

      await contract2.validate();
      expect(await contract2.isExpired()).eq(true);
    });
  });

  describe('after expiration approval should be reverted', () => {
    it('should revert', async () => {
      await new Promise((r) => setTimeout(r, 110));

      await contract2.validate();
      await expect(contract2.connect(arbiter).approve()).to.be.reverted;
    });
  });
});
