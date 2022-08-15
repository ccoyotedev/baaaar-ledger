import {
  utils,
  BigNumber
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
  const formattedERC721Purchases = await getFormattedERC721s(erc721Purchases.erc721Listings, true);

  console.log(formattedERC721Purchases);
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

const formatERC1155Purchases = (purchases, isPurchase) => {
  return purchases.map(purchase => {
    const nftId = `GOTCHI ERC1155 #${purchase.erc1155TypeId}`;
    const nftQuantity = Number(purchase.quantity);
    const tokenCost = Number(purchase.priceInWei / Math.pow(10, 18)) * nftQuantity;

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

const getFormattedERC721s = async (erc721s, isPurchase) => {
  const {
    gotchis,
    portals,
    realmParcels
  } = mapERC721Types(erc721s);
  const splitPurchases = await splitERC1155FromERC721s(gotchis);
  const equippedERC1155s = formatERC1155Purchases(splitPurchases.erc1155s, isPurchase);
  const formattedGotchis = formatERC721Listings(splitPurchases.gotchis, isPurchase, 'GOTCHI');
  const formattedPortals = formatERC721Listings(portals, isPurchase, 'GOTCHI');
  const formattedRealm = formatERC721Listings(realmParcels, isPurchase, 'REALM');
  return [...equippedERC1155s, ...formattedGotchis, ...formattedPortals, ...formattedRealm];
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
  let erc1155s = [];
  const gotchis = [];
  for (let i = 0; i < erc721s.length; i++) {

    const gotchi = erc721s[i];
    const equipped = await equippedERC1155(gotchi);
    erc1155s = [...erc1155s, ...equipped];

    gotchis.push({
      ...gotchi,
      priceInWei: Number(gotchi.priceInWei) - equipped.reduce((a, b) => a + Number(b.priceInWei), 0)
    })
  }
  return {
    erc1155s,
    gotchis
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
  return average.toString();
}

const formatERC721Listings = (listings, isPurchase, type) => {
  return listings.map(listing => {
    const nftId = `${type} ERC721 #${listing.tokenId}`;
    const nftQuantity = 1;
    const tokenCost = Number(listing.priceInWei / Math.pow(10, 18)) * nftQuantity;

    return {
      date: timestampToDate(listing.timePurchased),
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