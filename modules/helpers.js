import blockToTimestamp from '../polygon-block-timestamps.json';

export const timestampToDate = (timestamp) => {
  return new Date(Number(timestamp) * 1000);
}

export const priceInWeiToEthers = (priceInWei) => {
  return Number(priceInWei) / Math.pow(10, 18);
}

export const formatDate = (date) => {
  return (
    [
      date.getFullYear(),
      padTo2Digits(date.getMonth() + 1),
      padTo2Digits(date.getDate()),
    ].join('-') +
    ' ' + [
      padTo2Digits(date.getHours()),
      padTo2Digits(date.getMinutes()),
      padTo2Digits(date.getSeconds()),
    ].join(':') + ' UTC'
  );
}

export const padTo2Digits = (num) => {
  return num.toString().padStart(2, '0');
}

const inRange = (x, min, max) => {
  return ((x - min) * (x - max) <= 0);
}

export const findBlockRange = (timestamp) => {
  const blocks = Object.keys(blockToTimestamp);
  for (let i = 0; i < blocks.length - 2; i++) {
    const minBlock = blocks[i];
    const maxBlock = blocks[i + 1];
    const minTimestamp = blockToTimestamp[minBlock]
    const maxTimestamp = blockToTimestamp[maxBlock];
    if (inRange(Number(timestamp), minTimestamp, maxTimestamp)) {
      return {
        min: Number(minBlock),
        max: Number(maxBlock)
      }
    }
  }
}