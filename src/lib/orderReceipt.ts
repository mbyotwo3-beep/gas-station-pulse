import jsPDF from 'jspdf';

export interface OrderReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

export interface OrderReceiptData {
  orderId: string;
  serviceType: 'food_delivery' | 'package_delivery' | string;
  pickupAddress: string;
  deliveryAddress: string;
  items: OrderReceiptItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paid: boolean;
  specialInstructions?: string | null;
  timestamps: {
    placed?: string | null;
    pickedUp?: string | null;
    delivered?: string | null;
  };
}

const fmtDate = (iso?: string | null) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};
const money = (n: number) => `$${(n || 0).toFixed(2)}`;

export function generateOrderReceiptPDF(data: OrderReceiptData): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = margin;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(
    data.serviceType === 'food_delivery' ? 'Food Order Receipt' : 'Delivery Receipt',
    margin,
    y,
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(120);
  y += 18;
  doc.text(`Issued ${new Date().toLocaleString()}`, margin, y);
  doc.text(`Order #${data.orderId.slice(0, 8).toUpperCase()}`, pageWidth - margin, y, { align: 'right' });
  doc.setTextColor(0);

  y += 14;
  doc.setDrawColor(220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 22;

  // Addresses
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Route', margin, y);
  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const wrap = (txt: string) => doc.splitTextToSize(txt, pageWidth - margin * 2 - 70);

  doc.setTextColor(110);
  doc.text('Pickup', margin, y);
  doc.setTextColor(0);
  doc.text(wrap(data.pickupAddress || '—'), margin + 70, y);
  y += Math.max(14, wrap(data.pickupAddress || '—').length * 12);

  doc.setTextColor(110);
  doc.text('Delivery', margin, y);
  doc.setTextColor(0);
  doc.text(wrap(data.deliveryAddress || '—'), margin + 70, y);
  y += Math.max(14, wrap(data.deliveryAddress || '—').length * 12) + 10;

  // Timestamps
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Timeline', margin, y);
  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const tsRows: [string, string][] = [
    ['Placed', fmtDate(data.timestamps.placed)],
    ['Picked up', fmtDate(data.timestamps.pickedUp)],
    ['Delivered', fmtDate(data.timestamps.delivered)],
  ];
  tsRows.forEach(([k, v]) => {
    doc.setTextColor(110);
    doc.text(k, margin, y);
    doc.setTextColor(0);
    doc.text(v, margin + 110, y);
    y += 14;
  });

  y += 10;

  // Items
  if (data.items?.length) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Items', margin, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    data.items.forEach((it) => {
      const line = `${it.quantity} × ${it.name}`;
      doc.text(line, margin, y);
      doc.text(money(it.price * it.quantity), pageWidth - margin, y, { align: 'right' });
      y += 14;
    });
    y += 6;
  }

  // Totals
  doc.setDrawColor(220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 16;

  const totalRows: [string, number][] = [
    ['Subtotal', data.subtotal],
    ['Delivery fee', data.deliveryFee],
  ];
  totalRows.forEach(([k, v]) => {
    doc.setTextColor(110);
    doc.text(k, margin, y);
    doc.setTextColor(0);
    doc.text(money(v), pageWidth - margin, y, { align: 'right' });
    y += 14;
  });

  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Total', margin, y);
  doc.text(money(data.total), pageWidth - margin, y, { align: 'right' });

  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(data.paid ? 30 : 180, data.paid ? 130 : 70, data.paid ? 60 : 60);
  doc.text(data.paid ? 'Payment received' : 'Payment pending', margin, y);
  doc.setTextColor(0);

  if (data.specialInstructions) {
    y += 22;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Special instructions', margin, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(data.specialInstructions, pageWidth - margin * 2);
    doc.text(lines, margin, y);
  }

  const footerY = doc.internal.pageSize.getHeight() - margin;
  doc.setFontSize(9);
  doc.setTextColor(140);
  doc.text('Thank you for your order.', margin, footerY);
  doc.text('Keep this receipt for your records.', pageWidth - margin, footerY, { align: 'right' });

  return doc;
}

export function downloadOrderReceipt(data: OrderReceiptData) {
  const doc = generateOrderReceiptPDF(data);
  doc.save(`order-receipt-${data.orderId.slice(0, 8)}.pdf`);
}
