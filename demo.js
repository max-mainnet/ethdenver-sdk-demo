import { listDCLPools } from '@ref-finance/ref-sdk';

// list active pools
async function listPools() {
  const pools = await listDCLPools();
  console.log('pools: ', pools);
}

listPools();
