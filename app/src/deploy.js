export default async function deploy(factoryContract, arbiter, beneficiary, expiry, value) {
  const txResponse = await factoryContract.create(arbiter, beneficiary, expiry, { value });
  await txResponse.wait();
}
