import { ethers } from 'ethers';
import EscrowFactory from './artifacts/contracts/EscrowFactory.sol/EscrowFactory.json';

export default async function deployFactory(signer) {
  const factory = new ethers.ContractFactory(
    EscrowFactory.abi,
    EscrowFactory.bytecode,
    signer
  );
  return factory.deploy();
}
