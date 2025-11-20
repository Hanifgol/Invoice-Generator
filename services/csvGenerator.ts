
import { InvoiceData } from "../types";

const escapeCsvField = (field: any): string => {
  if (field === null || field === undefined) {
    return '';
  }
  const stringValue = String(field);
  // If the field contains a comma, quote, or newline, wrap it in quotes and escape existing quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

export const generateCsv = (data: InvoiceData) => {
  // 1. Define Headers
  const headers = [
    "Invoice Number",
    "Invoice Date",
    "Client Name",
    "Client Address",
    "Status",
    "Trip Date",
    "Description",
    "Time In",
    "Time Out",
    "Amount",
    "Total Invoice Amount"
  ];

  // 2. Map Invoice Items to Rows (Flattening the structure)
  // We repeat the parent invoice details for every line item to make it import-friendly
  const rows = data.items.map(item => [
    data.invoiceNumber,
    data.invoiceDate,
    data.clientName,
    data.clientAddress,
    data.status,
    item.date,
    item.description,
    item.timeIn || '',
    item.timeOut || '',
    item.amount.toFixed(2),
    data.totalAmount.toFixed(2)
  ]);

  // If there are no items, output at least one row with invoice meta-data
  if (rows.length === 0) {
    rows.push([
      data.invoiceNumber,
      data.invoiceDate,
      data.clientName,
      data.clientAddress,
      data.status,
      '',
      '',
      '',
      '',
      '0.00',
      data.totalAmount.toFixed(2)
    ]);
  }

  // 3. Construct CSV String
  const csvContent = [
    headers.map(escapeCsvField).join(','),
    ...rows.map(row => row.map(escapeCsvField).join(','))
  ].join('\n');

  // 4. Trigger Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  
  const sanitizedClient = (data.clientName || 'Client').replace(/[^a-z0-9]/gi, '_');
  link.setAttribute("href", url);
  link.setAttribute("download", `Invoice_${sanitizedClient}_${data.invoiceNumber || 'Draft'}.csv`);
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
