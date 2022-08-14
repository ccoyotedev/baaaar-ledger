import {
  fetchTransactions,
} from "./modules/transactions.js";
import exportToExcel from "./modules/exportToExcel.js";
import {
  provider
} from "./modules/contract.js";

// IN GENERAL ----------
// Fetch purchases in Baazaar + GBM auction
// Use GHST/GBP cost history to get GBP cost at time of purchase
// For ERC721 with equipped ERC1155, split cost of purchase using weekly sale average for each ERC1155 purchase
// Fetch sales in Baazaar
// Use GHST/GBP cost history to get GBP value at time of sale
// In case of ERC1155, use first matching ERC1155 as the COST_BASIS to calculate capital gain (FIFO crypto tax)

// FOR KOINLY IMPORT -----------
// Fetch purchases in Baazaar + GBM auction from subgraph
// For ERC721 with equipped ERC1155, split cost of purchase using weekly sale average for each ERC1155 purchase
// For the equipped ERC1155, set TxHash to undefined
// Repeat for sales
// Sort by date recieved
// Fetch TxHash for each transaction
// Export in format
// {
//    Date: 2021-04-05 23:31:02 UTC
//    Sent Amount: 100
//    Sent Currency: GHST
//    Received Amount: 1
//    Received Currency: GOTCHI ERC1155 (#123)
//    Fee Amount: 0
//    Fee Currency: MATIC
//    Net Worth Amount: undefined
//    Net Worth Currency: undefined
//    Label: swap
//    Description: undefined
//    TxHash: 0x12345
// }
// (data needed: timestamp, cost, quantity, type, id, txHash)

const ADDRESS = '0x7121cbda61e025eb6639cd797f63aad30f270680';

const init = async () => {
  // For Koinly import
  const transactions = await fetchTransactions(ADDRESS);
  const sortedTransactions = transactions.sort((a, b) => a.date - b.date < 0 ? 1 : -1)
  console.log(sortedTransactions);
  // const salesRes = await fetchSales(ADDRESS);

  // const sales = salesRes.erc1155Purchases.map(sale => {
  //   return {
  //     ...sale,
  //     priceInWei: -sale.priceInWei
  //   }
  // })

  // const purchaseAndSales = [...purchasesRes.erc1155Purchases, ...sales];
  // const sortedByDate = purchaseAndSales.sort((a, b) => a.timeLastPurchased - b.timeLastPurchased < 0 ? 1 : -1)

  // const groupedData = groupData(sortedByDate);

  // console.log(groupedData);
  // exportToExcel(groupedData);
}



const formatData = (subgraphResults) => {
  return subgraphResults.map(item => {
    return {
      date: new Date(Number(item.timeLastPurchased) * 1000),
      asset: `Gotchi ERC1155 (${item.erc1155TypeId})`
    }
  })
}

init();