'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Printer, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getVendorPaymentById, VendorPayment } from '@/lib/vendor-payments';
import { getOrdersWithDetails, OrderWithDetails } from '@/lib/orders';
import { useLanguage } from '@/context/language-context';
import { format, parseISO } from 'date-fns';

const translations = {
  en: {
    loading: 'Loading invoice...',
    notFound: 'Invoice not found.',
    back: 'Back to Vendor',
    print: 'Print Invoice',
    receiptStatus: 'RECEIPT STATUS',
    paymentReceipt: 'Payment Receipt',
    receiptDate: 'Receipt Date',
    paymentMethod: 'Payment Method',
    transactionNumber: 'Transaction Number',
    authNumber: 'Auth Number',
    bankCard: 'Bank Card',
    location: 'Location',
    vendorName: 'Vendor',
    invoiceNo: 'Invoice No',
    status: 'Status',
    name: 'Name',
    orderSummary: 'Orders',
    orderId: 'Order ID',
    quantity: 'Orders Count',
    invoiceDetails: 'Invoice Details',
    reference: 'Reference',
    serviceDesc: 'Service Desc',
    qty: 'Qty',
    amount: 'Amount',
    discount: 'Discount',
    total: 'Total',
    totalAmountPaid: 'Total Amount Paid',
    paid: 'Paid',
    pending: 'Pending',
    qr: 'QR',
    byRedX: 'By Red X for Electronics Trading & ads',
    noOrders: 'No order details available.',
    note: 'Note',
    viewAttachment: 'View Attachment',
    paymentAttachment: 'Payment Attachment',
  },
  ar: {
    loading: 'جارٍ تحميل الفاتورة...',
    notFound: 'الفاتورة غير موجودة.',
    back: 'العودة للبائع',
    print: 'طباعة الفاتورة',
    receiptStatus: 'حالة الإيصال',
    paymentReceipt: 'إيصال الدفع',
    receiptDate: 'تاريخ الإيصال',
    paymentMethod: 'طريقة الدفع',
    transactionNumber: 'رقم المعاملة',
    authNumber: 'رقم التفويض',
    bankCard: 'رقم البطاقة',
    location: 'الموقع',
    vendorName: 'البائع',
    invoiceNo: 'رقم الفاتورة',
    status: 'الحالة',
    name: 'الاسم',
    orderSummary: 'الطلبات',
    orderId: 'رقم الطلب',
    quantity: 'عدد الطلبات',
    invoiceDetails: 'تفاصيل الفاتورة',
    reference: 'المرجع',
    serviceDesc: 'وصف الخدمة',
    qty: 'الكمية',
    amount: 'المبلغ',
    discount: 'الخصم',
    total: 'الإجمالي',
    totalAmountPaid: 'المبلغ الإجمالي المدفوع',
    paid: 'مدفوع',
    pending: 'معلق',
    qr: 'ر.ق',
    byRedX: 'بواسطة ريد إكس للتجارة الإلكترونية',
    noOrders: 'لا تتوفر تفاصيل الطلبات.',
    note: 'ملاحظة',
    viewAttachment: 'عرض المرفق',
    paymentAttachment: 'مرفق الدفع',
  },
};

export default function VendorInvoicePage() {
  const { language, direction } = useLanguage();
  const tr = translations[language];
  const params = useParams();
  const router = useRouter();
  const vendorId = params.id as string;
  const paymentId = params.paymentId as string;

  const [payment, setPayment] = useState<VendorPayment | null>(null);
  const [vendorOrders, setVendorOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.dir = direction;
  }, [direction]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [paymentData, allOrders] = await Promise.all([
          getVendorPaymentById(paymentId),
          getOrdersWithDetails(),
        ]);
        setPayment(paymentData);
        if (paymentData?.orderIds?.length) {
          setVendorOrders(allOrders.filter(o => paymentData.orderIds.includes(o.id!)));
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [paymentId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="text-muted-foreground text-sm font-medium animate-pulse">{tr.loading}</span>
      </div>
    );
  }

  if (!payment) return <div className="p-8 text-center">{tr.notFound}</div>;

  const isPaid = payment.status === 'Paid';
  const receiptDate = payment.paidAt ? format(parseISO(payment.paidAt), 'yyyy-MM-dd HH:mm') : '—';
  const invoiceNumber = `INV-${paymentId.slice(-8).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-gray-100" dir={direction}>
      {/* Action bar — hidden on print */}
      <div className="print-hide flex items-center justify-between px-6 py-4 bg-white border-b shadow-sm">
        <Button variant="ghost" onClick={() => router.push(`/vendors/${vendorId}`)}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          {tr.back}
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" />
          {tr.print}
        </Button>
      </div>

      {/* Invoice document */}
      <div id="invoice-print-area" className="max-w-[800px] mx-auto my-8 print:my-0 bg-white shadow-lg print:shadow-none">
        <div
          style={{
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            background: '#fff',
            color: '#1a1a1a',
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
                {isPaid ? tr.paid : tr.pending}
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
          <div style={{ padding: '24px 30px' }}>

            {/* Title */}
            <h1 style={{ textAlign: 'center', fontWeight: 700, fontSize: 20, marginBottom: 20, color: '#3d0a1e', letterSpacing: 0.5 }}>
              {tr.paymentReceipt}
            </h1>

            {/* Info grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 40px', marginBottom: 20, fontSize: 13, background: '#fdf7f9', padding: '14px 18px', borderRadius: 10, border: '1px solid #f0dde6' }}>
              <div><span style={{ color: '#888' }}>{tr.receiptDate}</span><span style={{ margin: '0 6px', color: '#bbb' }}>:</span><span style={{ fontWeight: 600 }}>{receiptDate}</span></div>
              <div><span style={{ color: '#888' }}>{tr.invoiceNo}</span><span style={{ margin: '0 6px', color: '#bbb' }}>:</span><span style={{ fontWeight: 600 }}>{invoiceNumber}</span></div>
              <div><span style={{ color: '#888' }}>{tr.paymentMethod}</span><span style={{ margin: '0 6px', color: '#bbb' }}>:</span><span style={{ fontWeight: 600 }}>{payment.paymentMethod || '—'}</span></div>
              <div><span style={{ color: '#888' }}>{tr.status}</span><span style={{ margin: '0 6px', color: '#bbb' }}>:</span><span style={{ fontWeight: 600 }}>{isPaid ? tr.paid : tr.pending}</span></div>
              <div><span style={{ color: '#888' }}>{tr.transactionNumber}</span><span style={{ margin: '0 6px', color: '#bbb' }}>:</span><span style={{ fontWeight: 600 }}>{payment.transactionNumber || '—'}</span></div>
              {payment.authNumber && (
                <div><span style={{ color: '#888' }}>{tr.authNumber}</span><span style={{ margin: '0 6px', color: '#bbb' }}>:</span><span style={{ fontWeight: 600 }}>{payment.authNumber}</span></div>
              )}
              {payment.bankCardNumber && (
                <div><span style={{ color: '#888' }}>{tr.bankCard}</span><span style={{ margin: '0 6px', color: '#bbb' }}>:</span><span style={{ fontWeight: 600 }}>{payment.bankCardNumber}</span></div>
              )}
              {payment.location && (
                <div><span style={{ color: '#888' }}>{tr.location}</span><span style={{ margin: '0 6px', color: '#bbb' }}>:</span><span style={{ fontWeight: 600 }}>{payment.location}</span></div>
              )}
            </div>

            {/* Name bar */}
            <div style={{ background: 'linear-gradient(90deg, #3d0a1e, #6b1a3a)', color: '#fff', padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, fontWeight: 700, fontSize: 14, borderRadius: 10 }}>
              <span>{tr.name}</span>
              <span>{payment.vendorName}</span>
            </div>

            {/* Orders summary box */}
            <div style={{ border: '1.5px solid #d4a0b8', marginBottom: 16, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 16px', fontSize: 12, color: '#9b2a5a', background: '#fdf0f5' }}>
                <span style={{ fontWeight: 600 }}>{tr.orderSummary}</span>
                <span style={{ fontWeight: 600 }}>{tr.quantity}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid #edd5e2', fontSize: 13, fontWeight: 700, color: '#6b1a3a', background: '#fff' }}>
                <span>{invoiceNumber}</span>
                <span>{payment.orderCount}</span>
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
                  {vendorOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '16px 12px', textAlign: 'center', color: '#888', fontSize: 13 }}>
                        {tr.noOrders}
                      </td>
                    </tr>
                  ) : vendorOrders.map((order, i) => {
                    const amt = order.vendorAmount || 0;
                    const disc = order.discount || 0;
                    return (
                      <tr key={order.id} style={{ borderBottom: '1px solid #e8d5de', background: i % 2 === 0 ? '#fdf7f9' : '#fff' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#3d0a1e' }}>#{order.orderId}</td>
                        <td style={{ padding: '12px 14px', fontWeight: 600 }}>{order.serviceName}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600 }}>1</td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600 }}>{amt.toFixed(2)}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600 }}>{disc}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700, color: '#3d0a1e' }}>{(amt - disc).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Total Amount Paid */}
            <div style={{ background: 'linear-gradient(90deg, #3d0a1e, #6b1a3a)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 18px', fontWeight: 700, fontSize: 15, borderRadius: 10 }}>
              <span>{tr.totalAmountPaid}</span>
              <span>{tr.qr} {payment.amount.toFixed(2)}</span>
            </div>

            {/* Note */}
            {payment.note && (
              <div style={{ marginTop: 16, border: '1px solid #f5c842', background: '#fffbea', padding: '10px 14px', borderRadius: 4 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#b45309', marginBottom: 4 }}>{tr.note}</div>
                <div style={{ fontSize: 13, color: '#78350f' }}>{payment.note}</div>
              </div>
            )}

            {/* Attachment */}
            {payment.attachmentUrl && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#888', marginBottom: 8 }}>{tr.paymentAttachment}</div>
                {payment.attachmentUrl.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={payment.attachmentUrl} alt="Payment Attachment" style={{ maxWidth: '100%', maxHeight: 240, objectFit: 'contain', border: '1px solid #ddd' }} />
                ) : (
                  <div style={{ border: '1px solid #ddd', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', background: '#fafafa' }}>
                    <span style={{ fontSize: 13 }}>Payment receipt attached</span>
                    <a href={payment.attachmentUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#2563eb' }}>{tr.viewAttachment}</a>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .print-hide { display: none !important; }
          body { visibility: hidden; }
          #invoice-print-area { visibility: visible; position: fixed; top: 0; left: 0; width: 100%; }
          #invoice-print-area * {
            visibility: visible;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
        @page { margin: 0.6cm; }
      `}</style>
    </div>
  );
}
