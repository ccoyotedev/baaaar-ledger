import {
  utils
} from 'ethers';
import {
  timestampToDate
} from './helpers.js';
import {
  fetchGBMPurchases,
  fetchBaazaarERC1155Purchases,
  fetchBaazaarERC1155Sales
} from './subgraph.js';


const PURCHASE = 'PURCHASE';
const SALE = 'SALE';

export const fetchTransactions = async (address) => {
  const {
    bids
  } = await fetchGBMPurchases(address);
  const formattedBids = formatBids(bids);
  const purchaseERC1155Res = await fetchBaazaarERC1155Purchases(address);
  const formattedPurchasedErc1155 = formatERC1155Purchases(purchaseERC1155Res.erc1155Purchases, PURCHASE);
  const soldERC1155Res = await fetchBaazaarERC1155Sales(address);
  const formattedSoldErc1155 = formatERC1155Purchases(soldERC1155Res.erc1155Purchases, SALE);
  return [...formattedBids, ...formattedPurchasedErc1155, ...formattedSoldErc1155];
}

const formatBids = (bids) => {
  return bids.map(bid => {
    return {
      date: timestampToDate(bid.bidTime),
      sentAmount: Number(utils.formatEther(bid.amount)),
      sentCurrency: "GHST",
      receivedAmount: 1,
      receivedCurrency: `GOTCHI ${bid.type.toUpperCase()} #${bid.tokenId}`,
      feeAmount: 0,
      feeCurrency: 'MATIC',
      netWorthAmount: undefined,
      netWorthCurrency: undefined,
      label: 'swap',
      description: undefined,
      txHash: undefined
    }
  })
}

const formatERC1155Purchases = (purchases, type) => {
  const isPurchase = type === PURCHASE;

  return purchases.map(purchase => {
    const nftId = `GOTCHI ERC1155 #${purchase.erc1155TypeId}`;
    const nftQuantity = Number(purchase.quantity);
    const tokenCost = Number(utils.formatEther(purchase.priceInWei));

    return {
      date: timestampToDate(purchase.timeLastPurchased),
      sentAmount: isPurchase ? tokenCost : nftQuantity,
      sentCurrency: isPurchase ? "GHST" : nftId,
      receivedAmount: isPurchase ? nftQuantity : tokenCost,
      receivedCurrency: isPurchase ? nftId : "GHST",
      feeAmount: 0,
      feeCurrency: 'MATIC',
      netWorthAmount: undefined,
      netWorthCurrency: undefined,
      label: 'swap',
      description: undefined,
      txHash: undefined
    }
  })
}