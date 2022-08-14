import ethers from 'ethers';
import diamondAbi from '../abi/diamond.json';

const addresses = {
  diamond: '0x86935F11C86623deC8a25696E1C19a8659CbF95d',
}

const maticProvider = "https://rpc-mainnet.maticvigil.com/v1/6953cb25473bea6fa166c185b92af30ec74b2548"
export const provider = new ethers.providers.JsonRpcProvider(maticProvider)

export const useDiamondCall = async (
  method
) => {
  const contract = new ethers.Contract(addresses.diamond, diamondAbi, provider);
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