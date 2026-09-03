import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Invoice, InvoiceItem, CurrencyType, PaymentStatus } from '../types';
import {
  FileText,
  Plus,
  Printer,
  X,
  Trash2,
  Edit,
  Eye,
  Search,
  Save,
  CheckCircle,
  AlertCircle,
  Building,
  Layers,
  Sparkles,
  DollarSign,
  Calendar,
  Check
} from 'lucide-react';
import { formatCurrency, formatDate, numberToWords } from '../utils/numberToWords';

export const InvoicesView: React.FC<{
  isOpenNewModal: boolean;
  onCloseNewModal: () => void;
  onOpenNewModal: () => void;
}> = ({ isOpenNewModal, onCloseNewModal, onOpenNewModal }) => {
  const {
    invoices,
    customers,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    vatRates,
    defaultVatRate
  } = useApp();

  // Arama ve Filtreleme
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterPayment, setFilterPayment] = useState<string>('ALL');

  // Önizleme & Yazdırma Modalı
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);

  // İnceleme & Düzenleme Modalı State
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  // Yeni Manuel Fatura State
  const [newFormData, setNewFormData] = useState({
    customerId: customers[0]?.id || 101,
    invoiceNo: `TUR${new Date().getFullYear()}${String(Math.floor(Math.random() * 900000) + 100000)}`,
    invoiceDate: new Date().toISOString().split('T')[0],
    currency: 'TL' as CurrencyType,
    notes: 'Tevkifat Kapsamında Taşımacılık Hizmeti Faturası'
  });

  const [newItems, setNewItems] = useState<InvoiceItem[]>([
    {
      id: 'item-1',
      description: 'Mersin - Mardin Dökme Maden Taşımacılığı Hizmeti',
      quantity: 26.5,
      unit: 'Ton',
      unitPrice: 250,
      currency: 'TL',
      vatRate: 20,
      withholdingRate: '5/10',
      total: 6625
    }
  ]);

  // Yeni Kalem Ekleme (Yeni Fatura)
  const handleAddNewItem = () => {
    setNewItems(prev => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        description: '',
        quantity: 1,
        unit: 'Sefer',
        unitPrice: 1000,
        currency: newFormData.currency,
        vatRate: 20,
        withholdingRate: '5/10',
        total: 1000
      }
    ]);
  };

  const handleUpdateNewItem = (index: number, field: keyof InvoiceItem, val: any) => {
    setNewItems(prev => prev.map((item, idx) => {
      if (idx === index) {
        const updated = { ...item, [field]: val };
        if (field === 'quantity' || field === 'unitPrice') {
          updated.total = Number(updated.quantity) * Number(updated.unitPrice);
        }
        return updated;
      }
      return item;
    }));
  };

  const handleRemoveNewItem = (index: number) => {
    setNewItems(prev => prev.filter((_, idx) => idx !== index));
  };

  // Tevkifat Hesaplayıcı Fonksiyonu
  const calculateItemsTotals = (items: InvoiceItem[]) => {
    let sub = 0;
    let vat = 0;
    let withh = 0;
    items.forEach(it => {
      const lineTotal = Number(it.total) || 0;
      sub += lineTotal;
      const v = lineTotal * ((Number(it.vatRate) || 0) / 100);
      vat += v;
      if (it.withholdingRate === '2/10') withh += v * 0.2;
      else if (it.withholdingRate === '3/10') withh += v * 0.3;
      else if (it.withholdingRate === '4/10') withh += v * 0.4;
      else if (it.withholdingRate === '5/10') withh += v * 0.5;
      else if (it.withholdingRate === '7/10') withh += v * 0.7;
      else if (it.withholdingRate === '9/10') withh += v * 0.9;
    });
    const grand = sub + vat - withh;
    return { subTotal: sub, vatTotal: vat, withholdingTotal: withh, grandTotal: grand };
  };

  // Yeni Fatura Toplamları
  const newTotals = useMemo(() => {
    return calculateItemsTotals(newItems);
  }, [newItems]);

  // Yeni Fatura Kaydetme
  const handleSaveNewInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find(c => c.id === Number(newFormData.customerId));
    if (!cust) return;

    addInvoice({
      invoiceNo: newFormData.invoiceNo,
      invoiceDate: newFormData.invoiceDate,
      type: 'SATIS',
      customerId: cust.id,
      customerName: cust.name,
      taxOffice: cust.taxOffice,
      taxNumber: cust.taxNumber,
      address: cust.address,
      currency: newFormData.currency,
      exchangeRate: 1.0,
      subTotal: newTotals.subTotal,
      vatTotal: newTotals.vatTotal,
      withholdingTotal: newTotals.withholdingTotal,
      grandTotal: newTotals.grandTotal,
      writtenText: numberToWords(newTotals.grandTotal, newFormData.currency),
      paymentStatus: 'ODENMEDI',
      items: newItems,
      notes: newFormData.notes
    });

    onCloseNewModal();
  };

  // DÜZENLEME MODAL FONKSİYONLARI
  const handleOpenEdit = (inv: Invoice) => {
    setEditingInvoice(JSON.parse(JSON.stringify(inv))); // Derin kopya
  };

  const handleEditItemChange = (index: number, field: keyof InvoiceItem, val: any) => {
    if (!editingInvoice) return;
    const updatedItems = editingInvoice.items.map((item, idx) => {
      if (idx === index) {
        const u = { ...item, [field]: val };
        if (field === 'quantity' || field === 'unitPrice') {
          u.total = Number(u.quantity) * Number(u.unitPrice);
        }
        return u;
      }
      return item;
    });

    const totals = calculateItemsTotals(updatedItems);

    setEditingInvoice({
      ...editingInvoice,
      items: updatedItems,
      subTotal: totals.subTotal,
      vatTotal: totals.vatTotal,
      withholdingTotal: totals.withholdingTotal,
      grandTotal: totals.grandTotal,
      writtenText: numberToWords(totals.grandTotal, editingInvoice.currency)
    });
  };

  const handleAddEditItem = () => {
    if (!editingInvoice) return;
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      description: 'Ek Nakliye Hizmet Kalemi',
      quantity: 1,
      unit: 'Sefer',
      unitPrice: 1000,
      currency: editingInvoice.currency,
      vatRate: defaultVatRate || 20,
      withholdingRate: '5/10',
      total: 1000
    };
    const updatedItems = [...editingInvoice.items, newItem];
    const totals = calculateItemsTotals(updatedItems);

    setEditingInvoice({
      ...editingInvoice,
      items: updatedItems,
      subTotal: totals.subTotal,
      vatTotal: totals.vatTotal,
      withholdingTotal: totals.withholdingTotal,
      grandTotal: totals.grandTotal,
      writtenText: numberToWords(totals.grandTotal, editingInvoice.currency)
    });
  };

  const handleRemoveEditItem = (index: number) => {
    if (!editingInvoice) return;
    const updatedItems = editingInvoice.items.filter((_, idx) => idx !== index);
    const totals = calculateItemsTotals(updatedItems);

    setEditingInvoice({
      ...editingInvoice,
      items: updatedItems,
      subTotal: totals.subTotal,
      vatTotal: totals.vatTotal,
      withholdingTotal: totals.withholdingTotal,
      grandTotal: totals.grandTotal,
      writtenText: numberToWords(totals.grandTotal, editingInvoice.currency)
    });
  };

  const handleSaveEditedInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;

    updateInvoice(editingInvoice.id, editingInvoice);
    alert(`✓ ${editingInvoice.invoiceNo} numaralı fatura başarıyla güncellendi!`);
    setEditingInvoice(null);
  };

  // Filtrelenmiş Faturalar
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchPay = filterPayment === 'ALL' || inv.paymentStatus === filterPayment;
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm.trim() ||
        inv.invoiceNo.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        inv.notes?.toLowerCase().includes(q);
      return matchPay && matchSearch;
    });
  }, [invoices, filterPayment, searchTerm]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 1. ÜST KONTROL & BİLGİ BANDI */}
      <div
        className="glass-card"
        style={{
          padding: '14px 18px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderLeft: '4px solid var(--diza-red)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', margin: 0 }}>
              Fatura & Tevkifat Yönetimi
            </h3>
            <span
              style={{
                background: 'rgba(225, 29, 72, 0.1)',
                color: 'var(--diza-red)',
                padding: '2px 8px',
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 800
              }}
            >
              {invoices.length} Kayıtlı Fatura
            </span>
          </div>
          <p style={{ fontSize: 11.5, color: '#64748b', margin: '2px 0 0 0' }}>
            Tevkifatlı e-fatura düzenleme, fatura kalemlerini inceleme, düzenleme ve resmi döküm
          </p>
        </div>

        {/* Arama & Butonlar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Fatura No veya Müşteri Ara..."
              style={{
                width: 210,
                padding: '6px 10px 6px 28px',
                border: '1.5px solid #cbd5e1',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                background: '#ffffff',
                color: '#0f172a',
                outline: 'none'
              }}
            />
            <Search size={14} style={{ position: 'absolute', left: 8, top: 8, color: '#64748b' }} />
            {searchTerm && (
              <X
                size={13}
                onClick={() => setSearchTerm('')}
                style={{ position: 'absolute', right: 8, top: 8, color: '#94a3b8', cursor: 'pointer' }}
              />
            )}
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={onOpenNewModal}
            style={{ padding: '6px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <Plus size={15} /> Yeni Fatura Düzenle
          </button>
        </div>
      </div>

      {/* 2. FATURA LİSTESİ TABLOSU */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden', borderRadius: 8 }}>
        <div style={{ overflowX: 'auto', maxHeight: 580 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
            <thead>
              <tr
                style={{
                  background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                  color: '#ffffff',
                  fontWeight: 800
                }}
              >
                <th style={{ width: 110, padding: '9px 10px', textAlign: 'left', borderRight: '1px solid #334155' }}>Fatura No</th>
                <th style={{ width: 85, padding: '9px 8px', textAlign: 'center', borderRight: '1px solid #334155' }}>Tarih</th>
                <th style={{ padding: '9px 12px', textAlign: 'left', borderRight: '1px solid #334155' }}>Müşteri / Cari Ünvanı</th>
                <th style={{ width: 80, padding: '9px 8px', textAlign: 'center', borderRight: '1px solid #334155' }}>Kalem</th>
                <th style={{ width: 100, padding: '9px 8px', textAlign: 'right', borderRight: '1px solid #334155' }}>Matrah</th>
                <th style={{ width: 90, padding: '9px 8px', textAlign: 'right', borderRight: '1px solid #334155', color: '#93c5fd' }}>KDV</th>
                <th style={{ width: 95, padding: '9px 8px', textAlign: 'right', borderRight: '1px solid #334155', color: '#fca5a5' }}>Tevkifat</th>
                <th style={{ width: 115, padding: '9px 10px', textAlign: 'right', borderRight: '1px solid #334155', color: '#86efac' }}>Genel Toplam</th>
                <th style={{ width: 90, padding: '9px 8px', textAlign: 'center', borderRight: '1px solid #334155' }}>Ödeme</th>
                <th style={{ width: 150, padding: '9px 10px', textAlign: 'center' }}>İşlemler</th>
              </tr>
            </thead>

            <tbody>
              {filteredInvoices.map((inv, idx) => (
                <tr
                  key={inv.id}
                  style={{
                    borderBottom: '1px solid #e2e8f0',
                    background: idx % 2 === 1 ? '#f8fafc' : '#ffffff',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 1 ? '#f8fafc' : '#ffffff'}
                >
                  {/* Fatura No */}
                  <td
                    style={{ padding: '7px 10px', fontWeight: 900, color: 'var(--diza-red)', fontFamily: 'monospace', borderRight: '1px solid #e2e8f0', cursor: 'pointer' }}
                    onClick={() => handleOpenEdit(inv)}
                    title="Faturayı İncele & Düzenle"
                  >
                    {inv.invoiceNo}
                  </td>

                  {/* Tarih */}
                  <td style={{ padding: '7px 8px', textAlign: 'center', color: '#64748b', borderRight: '1px solid #e2e8f0' }}>
                    {inv.invoiceDate}
                  </td>

                  {/* Müşteri Ünvanı */}
                  <td
                    style={{ padding: '7px 12px', fontWeight: 700, color: '#0f172a', borderRight: '1px solid #e2e8f0', cursor: 'pointer' }}
                    onClick={() => handleOpenEdit(inv)}
                  >
                    <div>{inv.customerName}</div>
                    {inv.taxOffice && (
                      <div style={{ fontSize: 10, color: '#64748b', fontWeight: 400 }}>
                        {inv.taxOffice} V.D. • {inv.taxNumber}
                      </div>
                    )}
                  </td>

                  {/* Kalem Sayısı */}
                  <td style={{ padding: '7px 8px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>
                    <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: 4, fontSize: 10.5, fontWeight: 800 }}>
                      {inv.items.length} Kalem
                    </span>
                  </td>

                  {/* Matrah */}
                  <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#334155', borderRight: '1px solid #e2e8f0' }}>
                    {inv.subTotal?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </td>

                  {/* KDV */}
                  <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#2563eb', borderRight: '1px solid #e2e8f0' }}>
                    +{inv.vatTotal?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </td>

                  {/* Tevkifat */}
                  <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#dc2626', borderRight: '1px solid #e2e8f0' }}>
                    -{inv.withholdingTotal?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </td>

                  {/* Genel Toplam */}
                  <td style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 900, color: '#059669', fontSize: 12.5, borderRight: '1px solid #e2e8f0' }}>
                    {inv.grandTotal?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {inv.currency}
                  </td>

                  {/* Ödeme Durumu */}
                  <td style={{ padding: '7px 8px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>
                    <span
                      style={{
                        background: inv.paymentStatus === 'ODENDI' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                        color: inv.paymentStatus === 'ODENDI' ? '#059669' : '#dc2626',
                        padding: '2px 6px',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 900
                      }}
                    >
                      {inv.paymentStatus === 'ODENDI' ? 'ÖDENDİ' : 'ÖDENMEDİ'}
                    </span>
                  </td>

                  {/* Aksiyon Butonları (İncele/Düzenle, Yazdır, Sil) */}
                  <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 5 }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(inv)}
                        className="btn btn-primary"
                        style={{ padding: '4px 8px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        title="Fatura İçeriğini İncele ve Düzenle"
                      >
                        <Edit size={12} /> İncele / Düzenle
                      </button>

                      <button
                        type="button"
                        onClick={() => setPrintInvoice(inv)}
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        title="Resmi Fatura Dökümü / Yazdır"
                      >
                        <Printer size={12} />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`${inv.invoiceNo} numaralı faturayı silmek istediğinize emin misiniz?`)) {
                            deleteInvoice(inv.id);
                          }
                        }}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '3px' }}
                        title="Faturayı Sil"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ padding: 35, textAlign: 'center', color: '#94a3b8' }}>
                    Kriterlere uygun kayıtlı fatura bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Tablo Alt Toplam Özeti */}
        <div
          style={{
            padding: '10px 18px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 12
          }}
        >
          <div style={{ color: '#64748b' }}>
            Toplam: <strong>{filteredInvoices.length}</strong> Fatura
          </div>

          <div style={{ display: 'flex', gap: 20 }}>
            <div>
              <span style={{ color: '#64748b', marginRight: 6 }}>Toplam Matrah:</span>
              <strong style={{ color: '#0f172a', fontFamily: 'monospace', fontSize: 13 }}>
                {filteredInvoices.reduce((s, i) => s + (Number(i.subTotal) || 0), 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
              </strong>
            </div>

            <div>
              <span style={{ color: '#64748b', marginRight: 6 }}>Genel Toplam Ciro:</span>
              <strong style={{ color: 'var(--diza-red)', fontFamily: 'monospace', fontSize: 14, fontWeight: 900 }}>
                {filteredInvoices.reduce((s, i) => s + (Number(i.grandTotal) || 0), 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* 3. FATURA İNCELEME VE DÜZENLEME MODALI */}
      {editingInvoice && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16
          }}
        >
          <div
            className="glass-card"
            style={{
              background: '#ffffff',
              borderRadius: 10,
              width: 960,
              maxWidth: '96vw',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              padding: 0,
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#ffffff'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: 'var(--diza-red)', padding: 6, borderRadius: 6, display: 'flex' }}>
                  <FileText size={18} color="#ffffff" />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 900, margin: 0, color: '#ffffff' }}>
                    Fatura Detayı & Kalem Düzenleme
                  </h3>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                    {editingInvoice.invoiceNo} — {editingInvoice.customerName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingInvoice(null)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#ffffff', cursor: 'pointer', borderRadius: 4, padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Gövdesi */}
            <form onSubmit={handleSaveEditedInvoice} style={{ overflowY: 'auto', flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Üst Fatura Başlık Alanları */}
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>
                    Fatura No
                  </label>
                  <input
                    type="text"
                    value={editingInvoice.invoiceNo}
                    onChange={e => setEditingInvoice({ ...editingInvoice, invoiceNo: e.target.value })}
                    required
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 5, fontSize: 12, fontWeight: 800, color: 'var(--diza-red)', fontFamily: 'monospace' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>
                    Fatura Tarihi
                  </label>
                  <input
                    type="date"
                    value={editingInvoice.invoiceDate}
                    onChange={e => setEditingInvoice({ ...editingInvoice, invoiceDate: e.target.value })}
                    required
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 5, fontSize: 12 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>
                    Müşteri / Cari Ünvanı
                  </label>
                  <input
                    type="text"
                    value={editingInvoice.customerName}
                    onChange={e => setEditingInvoice({ ...editingInvoice, customerName: e.target.value })}
                    required
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 5, fontSize: 12, fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>
                    Ödeme Durumu
                  </label>
                  <select
                    value={editingInvoice.paymentStatus}
                    onChange={e => setEditingInvoice({ ...editingInvoice, paymentStatus: e.target.value as PaymentStatus })}
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 5, fontSize: 12, fontWeight: 800 }}
                  >
                    <option value="ODENMEDI">ÖDENMEDİ</option>
                    <option value="ODENDI">ÖDENDİ</option>
                    <option value="KISMI">KISMI ÖDENDİ</option>
                  </select>
                </div>
              </div>

              {/* Fatura Kalemleri Tablosu */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Layers size={15} color="var(--diza-red)" /> Fatura Kalemleri & Hizmet Dökümü ({editingInvoice.items.length} Kalem)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddEditItem}
                    className="btn btn-secondary"
                    style={{ padding: '4px 10px', fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Plus size={13} /> Kalem Ekle
                  </button>
                </div>

                <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#475569', fontWeight: 800 }}>
                        <th style={{ padding: '7px 8px', textAlign: 'left' }}>Açıklama / Güzergah</th>
                        <th style={{ width: 75, padding: '7px 6px', textAlign: 'center' }}>Miktar</th>
                        <th style={{ width: 65, padding: '7px 6px', textAlign: 'center' }}>Birim</th>
                        <th style={{ width: 85, padding: '7px 6px', textAlign: 'right' }}>Birim Fiyat</th>
                        <th style={{ width: 65, padding: '7px 6px', textAlign: 'center' }}>KDV</th>
                        <th style={{ width: 85, padding: '7px 6px', textAlign: 'center' }}>Tevkifat</th>
                        <th style={{ width: 95, padding: '7px 8px', textAlign: 'right' }}>Tutar</th>
                        <th style={{ width: 35, padding: '7px 4px', textAlign: 'center' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {editingInvoice.items.map((it, idx) => (
                        <tr key={it.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          {/* Açıklama */}
                          <td style={{ padding: '4px 6px' }}>
                            <input
                              type="text"
                              value={it.description}
                              onChange={e => handleEditItemChange(idx, 'description', e.target.value)}
                              placeholder="Hizmet / Güzergah açıklaması..."
                              style={{ width: '100%', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 11.5, fontWeight: 600 }}
                            />
                          </td>

                          {/* Miktar */}
                          <td style={{ padding: '4px 4px' }}>
                            <input
                              type="number"
                              step="0.01"
                              value={it.quantity}
                              onChange={e => handleEditItemChange(idx, 'quantity', Number(e.target.value))}
                              style={{ width: '100%', padding: '4px 4px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 11.5, textAlign: 'center', fontWeight: 800 }}
                            />
                          </td>

                          {/* Birim */}
                          <td style={{ padding: '4px 4px' }}>
                            <select
                              value={it.unit}
                              onChange={e => handleEditItemChange(idx, 'unit', e.target.value)}
                              style={{ width: '100%', padding: '4px 2px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 11 }}
                            >
                              <option value="Ton">Ton</option>
                              <option value="Sefer">Sefer</option>
                              <option value="Adet">Adet</option>
                              <option value="Paket">Paket</option>
                            </select>
                          </td>

                          {/* Birim Fiyat */}
                          <td style={{ padding: '4px 4px' }}>
                            <input
                              type="number"
                              step="0.01"
                              value={it.unitPrice}
                              onChange={e => handleEditItemChange(idx, 'unitPrice', Number(e.target.value))}
                              style={{ width: '100%', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 11.5, textAlign: 'right', fontWeight: 800, fontFamily: 'monospace' }}
                            />
                          </td>

                          {/* KDV */}
                          <td style={{ padding: '4px 4px' }}>
                            <select
                              value={it.vatRate}
                              onChange={e => handleEditItemChange(idx, 'vatRate', Number(e.target.value))}
                              style={{ width: '100%', padding: '4px 2px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 11 }}
                            >
                              <option value="20">%20 (Genel)</option>
                              <option value="10">%10 (İndirimli)</option>
                              <option value="1">%1 (Tarım)</option>
                              <option value="0">%0 (İstisna)</option>
                            </select>
                          </td>

                          {/* Tevkifat */}
                          <td style={{ padding: '4px 4px' }}>
                            <select
                              value={it.withholdingRate}
                              onChange={e => handleEditItemChange(idx, 'withholdingRate', e.target.value)}
                              style={{ width: '100%', padding: '4px 2px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 11, fontWeight: 700 }}
                            >
                              <option value="5/10">5/10 (Taşıma)</option>
                              <option value="2/10">2/10</option>
                              <option value="3/10">3/10</option>
                              <option value="4/10">4/10</option>
                              <option value="7/10">7/10</option>
                              <option value="9/10">9/10</option>
                              <option value="Yok">Tevkifatsız</option>
                            </select>
                          </td>

                          {/* Tutar */}
                          <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 900, color: '#0f172a' }}>
                            {it.total?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </td>

                          {/* Sil Butonu */}
                          <td style={{ padding: '4px 4px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveEditItem(idx)}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}
                              title="Kalemi Sil"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Fatura Toplam Özeti & Türkçe Yazıyla Tutar */}
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>
                    Özel Fatura Notu & Açıklama
                  </label>
                  <textarea
                    value={editingInvoice.notes || ''}
                    onChange={e => setEditingInvoice({ ...editingInvoice, notes: e.target.value })}
                    rows={2}
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 5, fontSize: 11.5 }}
                  />
                  <div style={{ marginTop: 6, fontSize: 11, color: '#0f172a', fontWeight: 700 }}>
                    Yazıyla: <span style={{ color: 'var(--diza-red)', fontStyle: 'italic' }}>{editingInvoice.writtenText}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, justifyContent: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Matrah (Ara Toplam):</span>
                    <strong style={{ fontFamily: 'monospace' }}>{editingInvoice.subTotal?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {editingInvoice.currency}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2563eb' }}>
                    <span>Hesaplanan KDV:</span>
                    <strong style={{ fontFamily: 'monospace' }}>+{editingInvoice.vatTotal?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {editingInvoice.currency}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                    <span>Tevkifat Tutarı:</span>
                    <strong style={{ fontFamily: 'monospace' }}>-{editingInvoice.withholdingTotal?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {editingInvoice.currency}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #cbd5e1', paddingTop: 6, fontSize: 14, color: '#059669' }}>
                    <span>Ödenecek Genel Toplam:</span>
                    <strong style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 900 }}>{editingInvoice.grandTotal?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {editingInvoice.currency}</strong>
                  </div>
                </div>
              </div>

              {/* Modal Footer Aksiyonları */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
                <button
                  type="button"
                  onClick={() => {
                    const inv = editingInvoice;
                    setEditingInvoice(null);
                    setPrintInvoice(inv);
                  }}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Printer size={14} /> Resmi Fatura Dökümü / Yazdır
                </button>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" onClick={() => setEditingInvoice(null)} className="btn btn-secondary">
                    Kapat
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 20px' }}>
                    <Save size={14} /> Değişiklikleri Kaydet
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. RESMİ FATURA YAZDIRMA & ÖNİZLEME MODALI */}
      {printInvoice && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16
          }}
        >
          <div
            className="glass-card"
            style={{
              background: '#ffffff',
              borderRadius: 10,
              width: 840,
              maxWidth: '95vw',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              padding: 0,
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '12px 20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#0f172a',
                color: '#ffffff'
              }}
            >
              <h3 style={{ fontSize: 14, fontWeight: 900, margin: 0, color: '#ffffff' }}>
                Resmi e-Fatura / Tevkifatlı Fatura Dökümü
              </h3>
              <button
                type="button"
                onClick={() => setPrintInvoice(null)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#ffffff', cursor: 'pointer', borderRadius: 4, padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Fatura Belgesi */}
            <div style={{ padding: 28, overflowY: 'auto', flex: 1, fontFamily: 'Segoe UI, Tahoma, sans-serif' }}>
              {/* Şirket Anteti ve Fatura Başlığı */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--diza-red)', paddingBottom: 16, marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin: 0 }}>
                    GÖRDİT BİLGİSAYAR VE TAŞIMACILIK LTD. ŞTİ.
                  </h2>
                  <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--diza-red)', margin: '2px 0 0 0' }}>
                    DİZA LOJİSTİK VE FİLO YÖNETİMİ
                  </p>
                  <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0 0' }}>
                    Tel: 0(324) 233 00 00 • Mersin • Zafer GÖRGÜN
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      background: 'rgba(225, 29, 72, 0.1)',
                      color: 'var(--diza-red)',
                      border: '1.5px solid var(--diza-red)',
                      padding: '4px 12px',
                      borderRadius: 4,
                      fontSize: 13,
                      fontWeight: 900
                    }}
                  >
                    e-FATURA / TEVKİFAT
                  </span>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', marginTop: 6, fontFamily: 'monospace' }}>
                    {printInvoice.invoiceNo}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                    Tarih: {printInvoice.invoiceDate}
                  </div>
                </div>
              </div>

              {/* Müşteri Bilgileri */}
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 6, marginBottom: 20, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>SAYIN:</div>
                  <strong style={{ fontSize: 14, color: '#0f172a' }}>{printInvoice.customerName}</strong>
                  <div style={{ fontSize: 11.5, color: '#475569', marginTop: 4 }}>
                    {printInvoice.address || 'Mersin / Türkiye'}
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 11.5, color: '#475569' }}>
                  <div>Vergi Dairesi: <strong>{printInvoice.taxOffice || 'Mersin V.D.'}</strong></div>
                  <div>Vergi / TC No: <strong style={{ fontFamily: 'monospace' }}>{printInvoice.taxNumber || '1234567890'}</strong></div>
                </div>
              </div>

              {/* Fatura Kalemleri Tablosu */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, marginBottom: 20 }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', color: '#0f172a', fontWeight: 800 }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>Sıra</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>Hizmet / Açıklama</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>Miktar</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Birim Fiyat</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>KDV</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>Tevkifat</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Tutar</th>
                  </tr>
                </thead>
                <tbody>
                  {printInvoice.items.map((it, idx) => (
                    <tr key={it.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 10px', color: '#64748b', fontWeight: 700 }}>{idx + 1}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0f172a' }}>{it.description}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 800 }}>{it.quantity} {it.unit}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace' }}>{it.unitPrice?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>%{it.vatRate}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', color: '#b45309', fontWeight: 700 }}>{it.withholdingRate}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 900, fontFamily: 'monospace' }}>{it.total?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Alt Toplam & Tevkifat Hesabı */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20, background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Fatura Notu:</div>
                  <div style={{ fontSize: 11.5, color: '#0f172a', fontWeight: 600, marginTop: 2 }}>
                    {printInvoice.notes || 'Tevkifat Kapsamında Taşımacılık Hizmeti Faturası'}
                  </div>
                  <div style={{ marginTop: 12, fontSize: 11.5, color: '#0f172a', fontWeight: 800 }}>
                    Yalnız: <span style={{ color: 'var(--diza-red)', fontStyle: 'italic' }}>{printInvoice.writtenText}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Matrah:</span>
                    <strong style={{ fontFamily: 'monospace' }}>{printInvoice.subTotal?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {printInvoice.currency}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2563eb' }}>
                    <span>Hesaplanan KDV:</span>
                    <strong style={{ fontFamily: 'monospace' }}>+{printInvoice.vatTotal?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {printInvoice.currency}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                    <span>Tevkifat Tutarı:</span>
                    <strong style={{ fontFamily: 'monospace' }}>-{printInvoice.withholdingTotal?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {printInvoice.currency}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #cbd5e1', paddingTop: 6, fontSize: 14, color: '#059669' }}>
                    <span>Ödenecek Tutar:</span>
                    <strong style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 900 }}>{printInvoice.grandTotal?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {printInvoice.currency}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '12px 20px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f8fafc'
              }}
            >
              <div style={{ fontSize: 11, color: '#64748b' }}>
                Gördit Bilgisayar — Zafer GÖRGÜN © 2026
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn btn-primary"
                  style={{ padding: '6px 16px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Printer size={14} /> Yazdır / PDF Kaydet
                </button>
                <button
                  type="button"
                  onClick={() => setPrintInvoice(null)}
                  className="btn btn-secondary"
                  style={{ padding: '6px 14px', fontSize: 12 }}
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. YENİ MANUEL FATURA DÜZENLEME MODALI */}
      {isOpenNewModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16
          }}
        >
          <div
            className="glass-card"
            style={{
              background: '#ffffff',
              borderRadius: 10,
              width: 900,
              maxWidth: '95vw',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              padding: 0
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#ffffff'
              }}
            >
              <h3 style={{ fontSize: 15, fontWeight: 900, margin: 0, color: '#ffffff' }}>
                Yeni e-Fatura / Tevkifatlı Fatura Düzenle
              </h3>
              <button
                type="button"
                onClick={onCloseNewModal}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#ffffff', cursor: 'pointer', borderRadius: 4, padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveNewInvoice} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                    Fatura No *
                  </label>
                  <input
                    type="text"
                    value={newFormData.invoiceNo}
                    onChange={e => setNewFormData({ ...newFormData, invoiceNo: e.target.value })}
                    required
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 5, fontSize: 12, fontWeight: 800, color: 'var(--diza-red)', fontFamily: 'monospace' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                    Fatura Tarihi *
                  </label>
                  <input
                    type="date"
                    value={newFormData.invoiceDate}
                    onChange={e => setNewFormData({ ...newFormData, invoiceDate: e.target.value })}
                    required
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 5, fontSize: 12 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                    Müşteri / Cari *
                  </label>
                  <select
                    value={newFormData.customerId}
                    onChange={e => setNewFormData({ ...newFormData, customerId: Number(e.target.value) })}
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 5, fontSize: 12, fontWeight: 700 }}
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.city ? `(${c.city})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                    Para Birimi
                  </label>
                  <select
                    value={newFormData.currency}
                    onChange={e => setNewFormData({ ...newFormData, currency: e.target.value as CurrencyType })}
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 5, fontSize: 12, fontWeight: 800 }}
                  >
                    <option value="TL">TL (Türk Lirası)</option>
                    <option value="USD">USD (Dolar)</option>
                    <option value="EUR">EUR (Euro)</option>
                  </select>
                </div>
              </div>

              {/* Kalemler */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#475569' }}>
                    FATURA KALEMLERİ / HİZMET DETAYLARI
                  </label>
                  <button type="button" className="btn btn-secondary" onClick={handleAddNewItem} style={{ padding: '4px 10px', fontSize: 11 }}>
                    <Plus size={13} /> Kalem Ekle
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {newItems.map((it, idx) => (
                    <div
                      key={it.id || idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 80px 80px 100px 80px 90px 30px',
                        gap: 8,
                        alignItems: 'center',
                        background: '#f8fafc',
                        padding: 8,
                        borderRadius: 6,
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <input
                        type="text"
                        value={it.description}
                        onChange={e => handleUpdateNewItem(idx, 'description', e.target.value)}
                        placeholder="Hizmet / Güzergah Açıklaması"
                        required
                        style={{ padding: '6px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 11.5 }}
                      />

                      <input
                        type="number"
                        step="0.01"
                        value={it.quantity}
                        onChange={e => handleUpdateNewItem(idx, 'quantity', Number(e.target.value))}
                        placeholder="Miktar"
                        required
                        style={{ padding: '6px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 11.5, textAlign: 'center' }}
                      />

                      <select
                        value={it.unit}
                        onChange={e => handleUpdateNewItem(idx, 'unit', e.target.value)}
                        style={{ padding: '6px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 11.5 }}
                      >
                        <option value="Ton">Ton</option>
                        <option value="Sefer">Sefer</option>
                        <option value="Adet">Adet</option>
                      </select>

                      <input
                        type="number"
                        step="0.01"
                        value={it.unitPrice}
                        onChange={e => handleUpdateNewItem(idx, 'unitPrice', Number(e.target.value))}
                        placeholder="Fiyat"
                        required
                        style={{ padding: '6px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 11.5, textAlign: 'right' }}
                      />

                      <select
                        value={it.vatRate}
                        onChange={e => handleUpdateNewItem(idx, 'vatRate', Number(e.target.value))}
                        style={{ padding: '6px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 11.5 }}
                      >
                        <option value="20">%20 (Genel)</option>
                        <option value="10">%10 (İndirimli)</option>
                        <option value="1">%1 (Tarım)</option>
                        <option value="0">%0 (İstisna)</option>
                      </select>

                      <select
                        value={it.withholdingRate}
                        onChange={e => handleUpdateNewItem(idx, 'withholdingRate', e.target.value)}
                        style={{ padding: '6px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 11.5 }}
                      >
                        <option value="5/10">5/10 (Taşıma)</option>
                        <option value="2/10">2/10</option>
                        <option value="3/10">3/10</option>
                        <option value="4/10">4/10</option>
                        <option value="7/10">7/10</option>
                        <option value="9/10">9/10</option>
                        <option value="Yok">Yok</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleRemoveNewItem(idx)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Not & Toplam */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14, background: '#f8fafc', padding: 12, borderRadius: 6, border: '1px solid #e2e8f0' }}>
                <textarea
                  value={newFormData.notes}
                  onChange={e => setNewFormData({ ...newFormData, notes: e.target.value })}
                  rows={2}
                  placeholder="Fatura notu..."
                  style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 11.5 }}
                />

                <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Matrah:</span>
                    <strong>{newTotals.subTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2563eb' }}>
                    <span>KDV (%20):</span>
                    <strong>+{newTotals.vatTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                    <span>Tevkifat (5/10):</span>
                    <strong>-{newTotals.withholdingTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: 4, color: '#059669', fontSize: 13 }}>
                    <span>Genel Toplam:</span>
                    <strong>{newTotals.grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={onCloseNewModal} className="btn btn-secondary">
                  İptal
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '7px 20px' }}>
                  Faturayı Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
