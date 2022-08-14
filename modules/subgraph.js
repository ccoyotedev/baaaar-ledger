import graphql from 'graphql-request';

export const coreURI = "https://api.thegraph.com/subgraphs/name/aavegotchi/aavegotchi-core-matic";
export const gbmURI = "https://api.thegraph.com/subgraphs/name/aavegotchi/aavegotchi-gbm-wearables";

export const fetchGBMPurchases = async (address) => {
  const winQuery = gbmWins(address);
  return await callSubgraph(winQuery, gbmURI);
}

const gbmWins = (address) => {
  return `{
      bids(first: 500, where:{bidder:"${address.toLowerCase()}", claimed: true, outbid: false}, orderBy: bidTime, orderDirection: desc) {
        id
        auctionID
        amount
        tokenId
        type
        bidTime
      }
    }`;
};

const callSubgraph = async (query, abi) => {
  try {
    const data = await graphql.request(abi || coreURI, query);
    return data;
  } catch (err) {
    return err
  }
};

export const fetchBaazaarERC1155Purchases = async (address) => {
  const purchaseQuery = erc1155Purchases(address);
  return await callSubgraph(purchaseQuery);
}

const erc1155Purchases = (address) => {
  return `{
    erc1155Purchases(where: { buyer: "${address}"}) {
      timeLastPurchased
      erc1155TypeId
      priceInWei
      quantity
      listingID
    }
  }`
}

export const fetchBaazaarERC1155Sales = async (address) => {
  const salesQuery = erc1155Sales(address);
  return await callSubgraph(salesQuery);
}

const erc1155Sales = (address) => {
  return `{
    erc1155Purchases(where: { seller: "${address}"}) {
      timeLastPurchased
      erc1155TypeId
      priceInWei
      quantity
    }
  }`
}

export const fetchERC721Purchases = async (address) => {
  const purchaseQuery = erc721Purchases(address);
  return await callSubgraph(purchaseQuery);
}

const erc721Purchases = (address) => {
  return `{
    erc721Listings(where: {timePurchased_gt: 0, buyer: "${address}"}) {
      tokenId
      priceInWei
      timePurchased
      gotchi {
        id
      }
      buyer
      parcelHash
      equippedWearables
    }
  }`
}

export const fetchWeeklyERC1155Sales = async (tokenId, timestamp) => {
  const salesQuery = weeklyERC1155Sales(tokenId, timestamp);
  return await callSubgraph(salesQuery);
}

const weeklyERC1155Sales = (tokenId, timestamp) => {
  const halfAWeek = 604800 / 2;
  const weekStart = timestamp - halfAWeek;
  const weekEnd = timestamp + halfAWeek;
  return `{
		erc1155Purchases(where: { timeLastPurchased_gt: ${weekStart}, timeLastPurchased_lt: ${weekEnd}, erc1155TypeId: "${tokenId}"}) {
      timeLastPurchased
      erc1155TypeId
      priceInWei
      quantity
    }
  }`
}