import {
  fetchTransactions,
} from "./modules/transactions.js";
import {
  formatDate
} from "./modules/helpers.js";
import exportToExcel from "./modules/exportToExcel.js";

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
  // TODO - Deduct sell fee from sales
  // TODO - Format column header name

  const transactions = await fetchTransactions(ADDRESS);
  const sortedTransactions = transactions.sort((a, b) => a.date - b.date < 0 ? 1 : -1)
  const formattedTransactions = formatData(sortedTransactions);

  exportToExcel(formattedTransactions);
}

const formatData = (transactions) => {
  return transactions.map((transaction) => {
    const copy = {
      ...transaction
    };
    copy.date = formatDate(copy.date);
    return copy;
  })
}

init();