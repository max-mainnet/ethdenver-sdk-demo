import { NEAR_META_DATA } from '@ref-finance/ref-sdk';
import {
  quote,
  ftGetTokenMetadata,
  getDCLPoolId,
  getConfig,
  DCLSwap,
  percentLess,
  toNonDivisibleNumber,
  toReadableNumber,
  getSignedTransactionsByMemoryKey,
  sendTransactionsByMemoryKey,
  DCLSwapByInputOnBestPool,
  list_history_orders,
  list_active_orders,
  cancel_order,
  claim_order,
  listDCLPools,
  getDCLPool,
  get_order,
  quote_by_output,
  list_user_assets,
  priceToPoint,
  pointToPrice,
  ftGetBalance,
} from '@ref-finance/ref-sdk';

const tokenInId = 'usdt.fakes.testnet';

const tokenOutId = 'wrap.testnet';

const fee = 100;

const input_amount = '1';

const pool_id = getDCLPoolId(tokenInId, tokenOutId, fee);

const pool_ids = [getDCLPoolId(tokenInId, tokenOutId, fee)];

const AccountId = 'juaner.testnet';

const keyPath = '/Users/everythingismax/.near-credentials/testnet/juaner.testnet.json';

// check active pools

async function listPools() {
  const pools = await listDCLPools();
  console.log('dcl pools: ', pools);
}

async function checkBalance() {
  const USDT = await ftGetTokenMetadata(tokenInId);

  const balance_of_usdt = await ftGetBalance(tokenInId, AccountId);

  console.log('balance_of_usdt: ', toReadableNumber(USDT.decimals, balance_of_usdt));

  const NEAR = NEAR_META_DATA;

  const balance_of_near = await ftGetBalance('NEAR', AccountId);

  console.log('balance_of_near: ', toReadableNumber(NEAR.decimals, balance_of_near));
}

async function quoteAmountOut() {
  const tokenA = await ftGetTokenMetadata(tokenInId);

  const tokenB = await ftGetTokenMetadata(tokenOutId);

  const res = await quote({
    pool_ids: pool_ids,
    input_token: tokenA,
    output_token: tokenB,
    input_amount: input_amount,
  });
  const output_amount = toReadableNumber(tokenB.decimals, res.amount);

  console.log('output_amount: ', output_amount);
}

async function swap() {
  await checkBalance();

  await quoteAmountOut();

  const tokenA = await ftGetTokenMetadata(tokenInId);

  const tokenB = await ftGetTokenMetadata(tokenOutId);

  const res = await DCLSwap({
    swapInfo: {
      amountA: input_amount,
      tokenA,
      tokenB,
    },
    Swap: {
      min_output_amount: '0',
      pool_ids,
    },
    AccountId,
  });

  await signAndSendTransactions(res);

  await checkBalance();
}

async function listActiveOrders() {
  const orders = await list_active_orders(AccountId);
  console.log('active orders: ', orders);
}

async function placeLimitOrder() {
  await checkBalance();

  await listActiveOrders();

  const tokenA = await ftGetTokenMetadata(tokenInId);

  const tokenB = await ftGetTokenMetadata(tokenOutId);

  const res = await DCLSwap({
    swapInfo: {
      amountA: input_amount,
      tokenA: tokenA,
      tokenB: tokenB,
    },
    LimitOrderWithSwap: {
      pool_id,
      output_amount: '4.0',
    },
    AccountId,
  });

  await signAndSendTransactions(res);

  await checkBalance();

  await listActiveOrders();
}

async function cancelOrder(order_id) {
  const payload = await cancel_order(order_id);

  await signAndSendTransactions(payload);

  await listActiveOrders();
}

async function signAndSendTransactions(txs) {
  const signedTransactions = await getSignedTransactionsByMemoryKey({
    transactionsRef: txs,
    AccountId,
    keyPath,
  });

  console.log(signedTransactions);

  const res = await sendTransactionsByMemoryKey({ signedTransactions });

  console.log(res);
}

// listPools();
// swap();
// placeLimitOrder();
// cancelOrder('usdt.fakes.testnet|wrap.testnet|100#22');
