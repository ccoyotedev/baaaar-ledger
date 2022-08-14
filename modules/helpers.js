export const timestampToDate = (timestamp) => {
  return new Date(Number(timestamp) * 1000);
}