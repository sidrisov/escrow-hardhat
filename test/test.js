const { ethers } = require('hardhat');
const helpers = require('@nomicfoundation/hardhat-network-helpers');

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
    // add 1 second due to block time adds 1 seconds
    contract2 = await Escrow.deploy(
      arbiter.getAddress(),
      beneficiary.getAddress(),
      1000 + 100,
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
      await helpers.time.increase(1);
      await contract1.validate();
      expect(await contract1.isExpired()).eq(false);
    });
  });

  describe("after validate is called the flag shoudn't be set as expired if expiry not 0 and time hasn't passed ", () => {
    it('should not expire', async () => {
      await contract2.validate();
      expect(await contract2.isExpired()).eq(false);
    });
  });

  describe("after validate is called the flag should set to be expired if time passed ", () => {
    it('should expire', async () => {
      await helpers.time.increase(1);

      await contract2.validate();
      expect(await contract2.isExpired()).eq(true);
    });
  });

  describe('after expiration approval should be reverted', () => {
    it('should revert', async () => {
      await helpers.time.increase(1);

      await contract2.validate();
      await expect(contract2.connect(arbiter).approve()).to.be.reverted;
    });
  });
});

describe('EscrowFactory', function () {
  let factoryContract;
  let depositor;
  let beneficiary;
  let arbiter;
  const deposit = ethers.utils.parseEther('1');
  let Escrow;
  beforeEach(async () => {
    depositor = ethers.provider.getSigner(0);
    beneficiary = ethers.provider.getSigner(1);
    arbiter = ethers.provider.getSigner(2);
    const EscrowFactory = await ethers.getContractFactory('EscrowFactory');
    factoryContract = await EscrowFactory.deploy();


    await factoryContract.deployed();

    Escrow = await ethers.getContractFactory('Escrow');

    // every transaction will generate new block with 1 sec timestamp increase, thus, add 5 seconds
    for (let i = 0; i < 5; i++) {
      await factoryContract.create(
        arbiter.getAddress(),
        beneficiary.getAddress(),
        5000 + 1 * (i + 1),
        {
          value: deposit,
        }
      );
      
      // every transaction increase
      console.log(await helpers.time.latest());
    }

  });

  describe('contracts should be created through factory', () => {
    it('should be created', async function () {
      const addresses = await factoryContract.getAddresses();
      expect(addresses.length).to.eq(5);
    });
  });

  describe("validate should not make any of contracts to be expired if time hasn't passed", () => {

    it("shouldn't expire", async function () {

      await factoryContract.validate();

      const contracts = (await factoryContract.getAddresses()).map(address => Escrow.attach(address));

      for (let i = 0; i < contracts.length; i++) {
        expect(await contracts[i].isExpired()).eq(false);
      }
    });
  });

  describe("validate should make contracts to be expired if time passed", () => {

    it("should expire", async function () {
      const contracts = (await factoryContract.getAddresses()).map(address => Escrow.attach(address));
      for (let i = 0; i < contracts.length; i++) {
        await helpers.time.increase(1);
        await factoryContract.validate();
        expect(await contracts[i].isExpired()).eq(true);
      }
    });
  });
});
