import {
  timestampToDate,
  priceInWeiToEthers
} from './helpers.js';
import {
  fetchGBMPurchases,
  fetchBaazaarERC1155Purchases,
  fetchBaazaarERC1155Sales,
  fetchERC721Purchases,
  fetchWeeklyERC1155Sales,
  fetchERC721Sales
} from './subgraph.js';
import {
  getERC1155ListingEvent
} from './contract.js';

export const fetchTransactions = async (address) => {
  const erc1155Transactions = await getERC1155Transactions(address);
  const erc721Transactions = await getERC721Transactions(address);

  return [...erc1155Transactions, ...erc721Transactions];
}

const getERC1155Transactions = async (address) => {
  const {
    bids
  } = await fetchGBMPurchases(address);
  const purchaseERC1155Res = await fetchBaazaarERC1155Purchases(address);
  const soldERC1155Res = await fetchBaazaarERC1155Sales(address);

  const formattedBids = formatBids(bids);
  const formattedPurchasedErc1155 = await formatERC1155Purchases(purchaseERC1155Res.erc1155Purchases, true);
  const formattedSoldErc1155 = await formatERC1155Purchases(soldERC1155Res.erc1155Purchases, false);

  return [...formattedBids, ...formattedPurchasedErc1155, ...formattedSoldErc1155];
}

const formatBids = (bids) => {
  return bids.map(bid => {
    const sent = {
      amount: priceInWeiToEthers(bid.amount),
      currency: "GHST",
    }
    const received = {
      amount: 1,
      currency: `GOTCHI ${bid.type.toUpperCase()} #${bid.tokenId}`
    }
    return mapToExcelFormat(bid.bidTime, sent, received);
  })
}

const mapToExcelFormat = (timeStamp, sent, received, txHash) => {
  return {
    date: timestampToDate(timeStamp),
    sentAmount: sent.amount,
    sentCurrency: sent.currency,
    receivedAmount: received.amount,
    receivedCurrency: received.currency,
    feeAmount: 0,
    feeCurrency: 'MATIC',
    netWorthAmount: undefined,
    netWorthCurrency: undefined,
    label: 'swap',
    description: undefined,
    txHash: txHash
  }
}

const formatERC1155Purchases = async (purchases, isPurchase) => {
  return await Promise.all(purchases.map(async purchase => {
    const nftId = `GOTCHI ERC1155 #${purchase.erc1155TypeId}`;
    const nftQuantity = Number(purchase.quantity);
    const tokenCost = priceInWeiToEthers(purchase.priceInWei) * nftQuantity;

    const event = await getERC1155ListingEvent(purchase.listingID, purchase.timeLastPurchased);
    const txHash = event ? event.transactionHash : undefined;

    const sent = {
      amount: isPurchase ? tokenCost : nftQuantity,
      currency: isPurchase ? "GHST" : nftId,
    }
    const received = {
      amount: isPurchase ? nftQuantity : tokenCost,
      currency: isPurchase ? nftId : "GHST"
    }

    return mapToExcelFormat(purchase.timeLastPurchased, sent, received, txHash)
  }))
}

const getERC721Transactions = async (address) => {
  const erc721Purchases = await fetchERC721Purchases(address);
  const formattedERC721Purchases = await getFormattedERC721s(erc721Purchases.erc721Listings, true);

  const erc721Sales = await fetchERC721Sales(address);
  const formattedERC721Sales = await getFormattedERC721s(erc721Sales.erc721Listings, false);
  return [...formattedERC721Purchases, ...formattedERC721Sales];
}

const getFormattedERC721s = async (erc721s, isPurchase) => {
  const {
    gotchis,
    portals,
    realmParcels
  } = mapERC721Types(erc721s);
  const splitPurchases = await splitERC1155FromERC721s(gotchis);
  const equippedERC1155s = await formatERC1155Purchases(splitPurchases.erc1155s, isPurchase);
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
    const tokenCost = priceInWeiToEthers(listing.priceInWei) * nftQuantity;

    const sent = {
      amount: isPurchase ? tokenCost : nftQuantity,
      currency: isPurchase ? "GHST" : nftId,
    }
    const received = {
      amount: isPurchase ? nftQuantity : tokenCost,
      currency: isPurchase ? nftId : "GHST"
    }

    return mapToExcelFormat(listing.timePurchased, sent, received)
  })
}