import {
  utils
} from 'ethers';
import {
  timestampToDate
} from './helpers.js';
import {
  fetchGBMPurchases,
  fetchBaazaarERC1155Purchases,
  fetchBaazaarERC1155Sales,
  fetchERC721Purchases,
  fetchWeeklyERC1155Sales
} from './subgraph.js';


const PURCHASE = 'PURCHASE';
const SALE = 'SALE';

export const fetchTransactions = async (address) => {
  const {
    bids
  } = await fetchGBMPurchases(address);
  // const formattedBids = formatBids(bids);
  // const purchaseERC1155Res = await fetchBaazaarERC1155Purchases(address);
  // const formattedPurchasedErc1155 = formatERC1155Purchases(purchaseERC1155Res.erc1155Purchases, PURCHASE);
  // const soldERC1155Res = await fetchBaazaarERC1155Sales(address);
  // const formattedSoldErc1155 = formatERC1155Purchases(soldERC1155Res.erc1155Purchases, SALE);
  // return [...formattedBids, ...formattedPurchasedErc1155, ...formattedSoldErc1155];

  const erc721Purchases = await fetchERC721Purchases(address);
  const erc721sMapped = mapERC721Types(erc721Purchases.erc721Listings);

  const splitPurchases = await splitERC1155FromERC721s(erc721sMapped.gotchis);
  console.log(splitPurchases);
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
    const tokenCost = Number(utils.formatEther(purchase.priceInWei)) * nftQuantity;

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

const mapERC721Types = (erc721s) => {
  const realmParcels = erc721s.filter(item => item.parcelHash);
  const portals = erc721s.filter(item => !item.parcelHash && !item.gotchi);
  const gotchis = erc721s.filter(item => item.gotchi);
  return {
    realmParcels,
    portals,
    gotchis
  }
}

const splitERC1155FromERC721s = async (erc721s) => {
  let allEquippedPurchases = [];
  const purchasedGotchis = [];
  for (let i = 0; i < erc721s.length; i++) {

    const gotchi = erc721s[i];
    const equipped = await equippedERC1155(gotchi);
    allEquippedPurchases = [...allEquippedPurchases, ...equipped];

    purchasedGotchis.push({
      ...gotchi,
      priceInWei: Number(gotchi.priceInWei) - equipped.reduce((a, b) => a + Number(b.priceInWei), 0)
    })
  }
  return {
    equipped: allEquippedPurchases,
    gotchis: purchasedGotchis
  }
}

const equippedERC1155 = async (gotchi) => {
  const equippedIds = gotchi.equippedWearables.filter(item => item !== 0 && item !== 210);

  return await Promise.all(equippedIds.map(async id => {
    const tokenCost = await fetchGoingRateForERC1155(id, gotchi.timePurchased);

    return {
      erc1155TypeId: id,
      quantity: 1,
      priceInWei: tokenCost,
      timeLastPurchased: gotchi.timePurchased
    }
  }))
}

const fetchGoingRateForERC1155 = async (tokenId, timePurchased) => {
  const {
    erc1155Purchases
  } = await fetchWeeklyERC1155Sales(tokenId, timePurchased);
  const average = erc1155Purchases.reduce((acc, curr) => acc + Number(curr.priceInWei), 0) / erc1155Purchases.length;
  return average;
}