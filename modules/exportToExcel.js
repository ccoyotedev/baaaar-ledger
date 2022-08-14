import xlsx from 'xlsx'
import path from 'path'

const workSheetName = "Baazaar Sales"
const filePath = "./baazaar_sales.xlsx"

const createXMLFileAndExport = (sales) => {
  const workBook = createWorkBook();
  const data = formatWorkbookData(sales);
  const workSheet = createWorkSheet(data);
  appendWorkSheetToWorkBook(workBook, workSheet, workSheetName);
  exportFile(workBook);
}

const createWorkBook = () => {
  const workBook = xlsx.utils.book_new();
  return workBook;
}

const formatWorkbookData = (sales) => {
  const columnNames = Object.keys(sales[0]);
  const data = sales.map(sale => {
    return [...Object.keys(sale).map(key => sale[key])];
  })
  const workSheetData = [
    columnNames,
    ...data
  ];
  return workSheetData;
}

const createWorkSheet = (data) => {
  const workSheet = xlsx.utils.aoa_to_sheet(data);
  return workSheet;
}

const appendWorkSheetToWorkBook = (workbook, worksheet, worksheetName) => {
  xlsx.utils.book_append_sheet(workbook, worksheet, worksheetName);
}

const exportFile = (workbook) => {
  xlsx.writeFile(workbook, path.resolve(filePath))
}

export default createXMLFileAndExport