import { formatDateTime } from './formatDate';

interface InvoiceItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface InvoiceData {
  shopName: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  total: number;
  amountPaid: number;
  changeGiven: number;
  customerName?: string;
  note?: string;
}

export const generateWhatsAppText = (data: InvoiceData): string => {
  const lines = [
    `🏪 ${data.shopName}`,
    `📅 ${formatDateTime(new Date().toISOString())}`,
    '\u2501'.repeat(20),
  ];

  for (const item of data.items) {
    lines.push(`${item.productName} x${item.quantity}   ${formatNumber(item.subtotal)} DA`);
  }

  lines.push('\u2501'.repeat(20));
  lines.push(`Subtotal:  ${formatNumber(data.subtotal)} DA`);
  if (data.discount > 0) {
    lines.push(`Discount:  -${formatNumber(data.discount)} DA`);
  }
  lines.push(`TOTAL:     ${formatNumber(data.total)} DA`);
  if (data.customerName) {
    lines.push(`Customer:  ${data.customerName}`);
  }
  lines.push('─'.repeat(20));
  lines.push(`Paid:      ${formatNumber(data.amountPaid)} DA`);
  if (data.changeGiven > 0) {
    lines.push(`Change:    ${formatNumber(data.changeGiven)} DA`);
  }
  if (data.note) {
    lines.push(`Note: ${data.note}`);
  }
  lines.push('─'.repeat(20));
  lines.push('Thank you!');

  return lines.join('\n');
};

export const generateInvoiceHTML = (data: InvoiceData): string => {
  const itemsHtml = data.items.map((item) => `
    <tr>
      <td>${item.productName} x${item.quantity}</td>
      <td style="text-align: right">${formatNumber(item.subtotal)} DA</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice - ${data.shopName}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
        .header { text-align: center; margin-bottom: 20px; }
        .header h1 { font-size: 24px; margin: 0; }
        .header p { color: #666; margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #1B6CA8; color: white; padding: 10px; text-align: left; }
        td { padding: 8px; border-bottom: 1px solid #eee; }
        .totals { margin-top: 20px; text-align: right; }
        .totals div { margin: 5px 0; }
        .total { font-size: 18px; font-weight: bold; color: #1B6CA8; }
        .footer { text-align: center; margin-top: 30px; color: #999; }
        .line { border-top: 2px dashed #ccc; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${data.shopName}</h1>
        <p>${formatDateTime(new Date().toISOString())}</p>
      </div>
      <div class="line"></div>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th style="text-align: right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      <div class="line"></div>
      <div class="totals">
        <div>Subtotal: ${formatNumber(data.subtotal)} DA</div>
        ${data.discount > 0 ? `<div>Discount: -${formatNumber(data.discount)} DA</div>` : ''}
        <div class="total">Total: ${formatNumber(data.total)} DA</div>
        <div>Paid: ${formatNumber(data.amountPaid)} DA</div>
        ${data.changeGiven > 0 ? `<div>Change: ${formatNumber(data.changeGiven)} DA</div>` : ''}
        ${data.customerName ? `<div>Customer: ${data.customerName}</div>` : ''}
        ${data.note ? `<div>Note: ${data.note}</div>` : ''}
      </div>
      <div class="footer">Thank you for your business!</div>
    </body>
    </html>
  `;
};

const formatNumber = (num: number): string => {
  return Math.round(num).toLocaleString('fr-DZ');
};
