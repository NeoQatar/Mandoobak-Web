'use client';

import { OrderWithDetails } from '@/lib/orders';
import { format } from 'date-fns';

type OrderReceiptProps = {
  order: OrderWithDetails;
  language: 'en' | 'ar';
};

const t = {
  en: {
    receiptStatus: 'RECEIPT STATUS',
    paymentReceipt: 'Payment Receipt',
    receiptDate: 'Receipt Date',
    paymentMethod: 'Payment Method',
    transactionNumber: 'Transaction Number',
    orderId: 'Order ID',
    status: 'Status',
    name: 'Name',
    serviceName: 'Service Name',
    quantity: 'Quantity',
    invoiceDetails: 'Invoice Details',
    reference: 'Reference',
    serviceDesc: 'Service Desc',
    qty: 'Qty',
    amount: 'Amount',
    discount: 'Discount',
    total: 'Total',
    totalAmountPaid: 'Total Amount Paid',
    paid: 'Paid',
    unpaid: 'Unpaid',
    qr: 'QR',
  },
  ar: {
    receiptStatus: 'حالة الإيصال',
    paymentReceipt: 'إيصال الدفع',
    receiptDate: 'تاريخ الإيصال',
    paymentMethod: 'طريقة الدفع',
    transactionNumber: 'رقم المعاملة',
    orderId: 'رقم الطلب',
    status: 'الحالة',
    name: 'الاسم',
    serviceName: 'اسم الخدمة',
    quantity: 'الكمية',
    invoiceDetails: 'تفاصيل الفاتورة',
    reference: 'المرجع',
    serviceDesc: 'وصف الخدمة',
    qty: 'الكمية',
    amount: 'المبلغ',
    discount: 'الخصم',
    total: 'الإجمالي',
    totalAmountPaid: 'المبلغ الإجمالي المدفوع',
    paid: 'مدفوع',
    unpaid: 'غير مدفوع',
    qr: 'ر.ق',
  },
};

export default function OrderReceipt({ order, language }: OrderReceiptProps) {
  const tr = t[language];
  const isPaid = order.orderStatus === 'Order Completed';
  const receiptDate = order.createdAt
    ? format(new Date(order.createdAt as string), 'yyyy-MM-dd HH:mm')
    : '—';
  const discount = order.discount || 0;
  const total = (order.totalPrice || 0) - discount;

  return (
    <div
      style={{
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        background: '#fff',
        color: '#1a1a1a',
        maxWidth: 800,
        margin: '0 auto',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(109,26,58,0.10)',
        border: '1px solid #f0e0e8',
      }}
    >
      {/* ── TOP HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 28px 14px', background: '#fff' }}>

        {/* Receipt Status — top left */}
        <div style={{ border: '2px solid #6b1a3a', padding: '7px 14px', borderRadius: 10, minWidth: 120 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#6b1a3a', marginBottom: 5, letterSpacing: 1 }}>
            {tr.receiptStatus}
          </div>
          <div style={{
            background: isPaid ? '#f0faf4' : '#fff5f5',
            border: `1px solid ${isPaid ? '#4caf50' : '#6b1a3a'}`,
            padding: '4px 10px',
            textAlign: 'center',
            fontSize: 12,
            fontWeight: 700,
            color: isPaid ? '#2e7d32' : '#6b1a3a',
            borderRadius: 6,
          }}>
            {isPaid ? tr.paid : tr.unpaid}
          </div>
        </div>

        {/* Logo — top right */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/images/Mandobak%20Logo-01.png"
          alt="Mandobak"
          style={{ height: 72, maxWidth: 220, objectFit: 'contain' }}
        />
      </div>

      {/* ── DARK DIVIDER BAR ── */}
      <div style={{ height: 10, background: 'linear-gradient(90deg, #3d0a1e 0%, #6b1a3a 50%, #3d0a1e 100%)' }} />

      {/* ── MAIN CONTENT ── */}
      <div style={{ padding: '24px 28px' }}>

        {/* Title */}
        <h1 style={{ textAlign: 'center', fontWeight: 700, fontSize: 20, marginBottom: 20, color: '#3d0a1e', letterSpacing: 0.5 }}>
          {tr.paymentReceipt}
        </h1>

        {/* Info grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 40px', marginBottom: 20,
          fontSize: 13, background: '#fdf7f9', padding: '14px 18px', borderRadius: 10, border: '1px solid #f0dde6',
        }}>
          <div><span style={{ color: '#888' }}>{tr.receiptDate}</span><span style={{ margin: '0 6px', color: '#bbb' }}>:</span><span style={{ fontWeight: 600 }}>{receiptDate}</span></div>
          <div><span style={{ color: '#888' }}>{tr.orderId}</span><span style={{ margin: '0 6px', color: '#bbb' }}>:</span><span style={{ fontWeight: 600 }}>{order.orderId}</span></div>
          <div><span style={{ color: '#888' }}>{tr.paymentMethod}</span><span style={{ margin: '0 6px', color: '#bbb' }}>:</span><span style={{ fontWeight: 600 }}>{'—'}</span></div>
          <div><span style={{ color: '#888' }}>{tr.status}</span><span style={{ margin: '0 6px', color: '#bbb' }}>:</span><span style={{ fontWeight: 600 }}>{isPaid ? tr.paid : tr.unpaid}</span></div>
          <div><span style={{ color: '#888' }}>{tr.transactionNumber}</span><span style={{ margin: '0 6px', color: '#bbb' }}>:</span><span style={{ fontWeight: 600 }}>{'—'}</span></div>
        </div>

        {/* Name bar */}
        <div style={{
          background: 'linear-gradient(90deg, #3d0a1e, #6b1a3a)',
          color: '#fff', padding: '12px 18px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 14, fontWeight: 700, fontSize: 14, borderRadius: 10,
        }}>
          <span>{tr.name}</span>
          <span>{order.orderId}</span>
        </div>

        {/* Service box */}
        <div style={{ border: '1.5px solid #d4a0b8', marginBottom: 16, borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 16px', fontSize: 12, color: '#9b2a5a', background: '#fdf0f5' }}>
            <span style={{ fontWeight: 600 }}>{tr.serviceName}</span>
            <span style={{ fontWeight: 600 }}>{tr.quantity}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid #edd5e2', fontSize: 13, fontWeight: 700, color: '#6b1a3a', background: '#fff' }}>
            <span>{order.serviceName}</span>
            <span>1</span>
          </div>
        </div>

        {/* Invoice Details table */}
        <div style={{ border: '1.5px solid #d4a0b8', marginBottom: 16, borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(90deg, #3d0a1e, #6b1a3a)', color: '#fff', padding: '9px 16px', fontWeight: 700, fontSize: 13 }}>
            {tr.invoiceDetails}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid #d4a0b8', background: '#f5e6ee' }}>
                <th style={{ textAlign: 'left', padding: '9px 14px', fontWeight: 700, color: '#6b1a3a' }}>{tr.reference}</th>
                <th style={{ textAlign: 'left', padding: '9px 14px', fontWeight: 700, color: '#6b1a3a' }}>{tr.serviceDesc}</th>
                <th style={{ textAlign: 'center', padding: '9px 14px', fontWeight: 700, color: '#6b1a3a' }}>{tr.qty}</th>
                <th style={{ textAlign: 'center', padding: '9px 14px', fontWeight: 700, color: '#6b1a3a' }}>{tr.amount}</th>
                <th style={{ textAlign: 'center', padding: '9px 14px', fontWeight: 700, color: '#6b1a3a' }}>{tr.discount}</th>
                <th style={{ textAlign: 'center', padding: '9px 14px', fontWeight: 700, color: '#6b1a3a' }}>{tr.total}</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ background: '#fdf7f9', borderBottom: '1px solid #e8d5de' }}>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: '#3d0a1e' }}>{order.orderId}</td>
                <td style={{ padding: '12px 14px', fontWeight: 600 }}>{order.serviceName}</td>
                <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600 }}>1</td>
                <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600 }}>{(order.totalPrice || 0).toFixed(2)}</td>
                <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600 }}>{discount}</td>
                <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700, color: '#3d0a1e' }}>{total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Total Amount Paid */}
        <div style={{
          background: 'linear-gradient(90deg, #3d0a1e, #6b1a3a)',
          color: '#fff',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '13px 18px', fontWeight: 700, fontSize: 15, borderRadius: 10,
        }}>
          <span>{tr.totalAmountPaid}</span>
          <span>{tr.qr} {total.toFixed(2)}</span>
        </div>

      </div>
    </div>
  );
}
