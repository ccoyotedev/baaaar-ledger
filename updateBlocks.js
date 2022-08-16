import {
  provider
} from "./modules/contract.js";
import fs from "fs";

const path = "./polygon-block-timestamps.json"

const writeBlocks = async () => {
  try {
    const currentBlock = await provider.getBlock();
    const maxBlockNumber = currentBlock.number;

    let nextBlockNumber = 0;
    while (nextBlockNumber <= maxBlockNumber) {
      const file = fs.readFileSync(path, 'utf8');
      const jsonData = JSON.parse(file);

      const blockNumbers = Object.keys(jsonData);
      const minBlockNumber = Number(blockNumbers.at(-1));
      nextBlockNumber = minBlockNumber + 1000;

      const nextBlock = await provider.getBlock(nextBlockNumber);
      const timestamp = nextBlock.timestamp;

      console.log(nextBlock.number, ": ", timestamp)
      const data = {
        ...jsonData,
        [nextBlock.number]: timestamp
      };
      fs.writeFileSync(path, JSON.stringify(data));
    }

  } catch (err) {
    console.log(err);
  }
}

writeBlocks();