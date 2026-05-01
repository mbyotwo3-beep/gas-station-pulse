import jsPDF from 'jspdf';
import type { FareBreakdown } from '@/hooks/useActiveRide';

export interface RideReceiptData {
  rideId: string;
  pickupAddress: string;
  destinationAddress: string;
  distanceKm: number;
  durationMin: number;
  fareBreakdown: FareBreakdown;
  paid: boolean;
  driverName?: string;
  passengerName?: string;
  timestamps: {
    requested?: string | null;
    started?: string | null;
    arrived?: string | null;
    completed?: string | null;
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

const money = (n: number) => `$${n.toFixed(2)}`;

export function generateRideReceiptPDF(data: RideReceiptData): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = margin;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('Trip Receipt', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(120);
  y += 18;
  doc.text(
    `Issued ${new Date().toLocaleString()}`,
    margin,
    y,
  );
  doc.text(`Ride #${data.rideId.slice(0, 8).toUpperCase()}`, pageWidth - margin, y, { align: 'right' });
  doc.setTextColor(0);

  // Divider
  y += 14;
  doc.setDrawColor(220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 22;

  // Parties
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Driver', margin, y);
  doc.text('Passenger', pageWidth / 2, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  y += 14;
  doc.text(data.driverName || '—', margin, y);
  doc.text(data.passengerName || '—', pageWidth / 2, y);

  y += 26;

  // Route
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Route', margin, y);
  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const wrap = (txt: string) => doc.splitTextToSize(txt, pageWidth - margin * 2 - 60);
  doc.setTextColor(110);
  doc.text('Pickup', margin, y);
  doc.setTextColor(0);
  doc.text(wrap(data.pickupAddress), margin + 60, y);
  y += Math.max(14, wrap(data.pickupAddress).length * 12);
  doc.setTextColor(110);
  doc.text('Drop-off', margin, y);
  doc.setTextColor(0);
  doc.text(wrap(data.destinationAddress), margin + 60, y);
  y += Math.max(14, wrap(data.destinationAddress).length * 12) + 10;

  // Stats
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Trip', margin, y);
  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const rows: [string, string][] = [
    ['Distance', `${data.distanceKm.toFixed(1)} km`],
    ['Duration', `${data.durationMin} min`],
    ['Requested', fmtDate(data.timestamps.requested)],
    ['Started', fmtDate(data.timestamps.started)],
    ['Arrived', fmtDate(data.timestamps.arrived)],
    ['Completed', fmtDate(data.timestamps.completed)],
  ];
  rows.forEach(([k, v]) => {
    doc.setTextColor(110);
    doc.text(k, margin, y);
    doc.setTextColor(0);
    doc.text(v, margin + 110, y);
    y += 14;
  });

  y += 10;

  // Fare breakdown
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Fare breakdown', margin, y);
  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const fb = data.fareBreakdown;
  const fareRows: [string, number][] = [
    ['Base fare', fb.base],
    ['Distance', fb.distance],
    ['Time', fb.time],
  ];
  if (fb.surge && fb.surge > 0) fareRows.push(['Surge', fb.surge]);
  if (fb.fees && fb.fees > 0) fareRows.push(['Service fee', fb.fees]);

  fareRows.forEach(([k, v]) => {
    doc.setTextColor(110);
    doc.text(k, margin, y);
    doc.setTextColor(0);
    doc.text(money(v), pageWidth - margin, y, { align: 'right' });
    y += 14;
  });

  y += 6;
  doc.setDrawColor(220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 18;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Total', margin, y);
  doc.text(money(fb.total), pageWidth - margin, y, { align: 'right' });

  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(data.paid ? 30 : 180, data.paid ? 130 : 70, data.paid ? 60 : 60);
  doc.text(data.paid ? 'Payment received' : 'Payment pending', margin, y);
  doc.setTextColor(0);

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - margin;
  doc.setFontSize(9);
  doc.setTextColor(140);
  doc.text('Thank you for riding with us.', margin, footerY);
  doc.text('Keep this receipt for your records.', pageWidth - margin, footerY, { align: 'right' });

  return doc;
}

export function downloadRideReceipt(data: RideReceiptData) {
  const doc = generateRideReceiptPDF(data);
  doc.save(`ride-receipt-${data.rideId.slice(0, 8)}.pdf`);
}
