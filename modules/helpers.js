export const timestampToDate = (timestamp) => {
  return new Date(Number(timestamp) * 1000);
}

export const priceInWeiToEthers = (priceInWei) => {
  return Number(priceInWei / Math.pow(10, 18));
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