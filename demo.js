import { NEAR_META_DATA, nearDepositTransaction } from '@ref-finance/ref-sdk';
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
  ftGetBalance,
} from '@ref-finance/ref-sdk';

const tokenInId = 'usdc.fakes.testnet';

const tokenOutId = 'aurora.fakes.testnet';

const fee = 2000;

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
  const AURORA = await ftGetTokenMetadata(tokenOutId);

  const balance_of_aurora = await ftGetBalance(tokenOutId, AccountId);

  console.log('balance_of_aurora: ', toReadableNumber(AURORA.decimals, balance_of_aurora));

  const USDC = await ftGetTokenMetadata(tokenInId);

  const balance_of_usdc = await ftGetBalance(tokenInId, AccountId);

  console.log('balance_of_usdc: ', toReadableNumber(USDC.decimals, balance_of_usdc));
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

  console.log('output amount of aurora: ', output_amount);
}

async function swapMarketPrice() {
  await checkBalance();

  await quoteAmountOut();

  const tokenA = await ftGetTokenMetadata(tokenInId);

  const tokenB = await ftGetTokenMetadata(tokenOutId);

  // get payload of transactions
  const payload = await DCLSwap({
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

  await signAndSendTransactions(payload);

  await checkBalance();
}

async function listActiveOrders() {
  const orders = await list_active_orders(AccountId);
  console.log('my active orders: ', orders);
}

async function placeLimitOrder() {
  await checkBalance();

  await listActiveOrders();

  const tokenA = await ftGetTokenMetadata(tokenInId);

  const tokenB = await ftGetTokenMetadata(tokenOutId);

  const payload = await DCLSwap({
    swapInfo: {
      amountA: input_amount,
      tokenA: tokenA,
      tokenB: tokenB,
    },
    LimitOrderWithSwap: {
      pool_id,
      output_amount: '4',
    },
    AccountId,
  });

  await signAndSendTransactions(payload);

  await checkBalance();

  await listActiveOrders();
}

async function cancelOrder(order_id) {
  const payload = await cancel_order(order_id);

  await signAndSendTransactions(payload);

  await listActiveOrders();
}

async function signAndSendTransactions(payload) {
  // got signed transactions

  console.log('we are trying to sign and send transactions...');

  const signedTransactions = await getSignedTransactionsByMemoryKey({
    transactionsRef: payload,
    AccountId,
    keyPath,
  }).catch((e) => {
    console.log('error: ', e);
  });

  const res = await sendTransactionsByMemoryKey({ signedTransactions }).catch((e) => {
    console.log('error: ', e);
  });

  console.log('res: ', res);

  console.log('transactions sent!');
}

// listPools();
// checkBalance();
// quoteAmountOut();
// swapMarketPrice();
// listActiveOrders();
placeLimitOrder();
// cancelOrder('aurora.fakes.testnet|usdc.fakes.testnet|2000#8');
