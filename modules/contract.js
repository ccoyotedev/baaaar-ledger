import * as dotenv from 'dotenv';
dotenv.config();

import ethers from 'ethers';
import diamondAbi from '../abi/diamond.json';
import {
  findBlockRange
} from './helpers.js';

const addresses = {
  diamond: '0x86935F11C86623deC8a25696E1C19a8659CbF95d',
}

export const provider = new ethers.providers.JsonRpcProvider(process.env.JSON_RPC_PROVIDER)
const contract = new ethers.Contract(addresses.diamond, diamondAbi, provider);

export const getERC1155ListingEvent = async (listingId, timestamp) => {
  return await getEvent('ERC1155ExecutedListing', listingId, timestamp);
}

export const getERC721ListingEvent = async (listingId, timestamp) => {
  return await getEvent('ERC721ExecutedListing', listingId, timestamp);
}

const getEvent = async (eventName, listingId, timestamp) => {
  const range = findBlockRange(timestamp);
  if (!range) return;

  const receivedFilter = contract.filters[eventName](listingId);
  const events = await contract.queryFilter(receivedFilter, range.min, range.max);
  return events[0];
}

export const useDiamondCall = async (
  method
) => {
  try {
    const {
      name,
      parameters
    } = method;
    const res = await (parameters ?
      contract[name](...parameters) :
      contract[name]());
    return res;
  } catch (err) {
    throw {
      status: 400,
      name: "Diamond contract error",
      message: err.message,
      stack: err.stack,
    };
  }
};