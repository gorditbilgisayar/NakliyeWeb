import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Customer } from '../types';
import { TURKEY_CITIES_DISTRICTS, CITIES_LIST } from '../utils/turkeyCities';
import { formatPhoneNumber, cleanPhoneForTelLink } from '../utils/phoneFormatter';
import {
  Users,
  Plus,
  Phone,
  Mail,
  MapPin,
  FileSpreadsheet,
  X,
  Search,
  Building,
  ShieldAlert,
  Printer,
  Trash2,
  Edit,
  Save,
  Check,
  FileText
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/numberToWords';

export const CustomersView: React.FC = () => {
  const {
    customers,
    shipments,
    invoices,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerBalance
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    authorizedFirstName: '',
    authorizedLastName: '',
    gsmPhone: '',
    workPhone: '',
    fax: '',
    email: '',
    city: 'Mersin',
    district: 'Akdeniz',
    billingAddress: '',
    shippingAddress: '',
    taxOffice: '',
    taxNumber: '',
    isProblematic: false,
    problemReason: '',
    notes: ''
  });

  // Seçili İle Göre İlçeler Listesi
  const availableDistricts = TURKEY_CITIES_DISTRICTS[formData.city || 'Mersin'] || ['Merkez'];

  const handleCityChange = (newCity: string) => {
    const firstDistrict = TURKEY_CITIES_DISTRICTS[newCity]?.[0] || 'Merkez';
    setFormData({
      ...formData,
      city: newCity,
      district: firstDistrict
    });
  };

  // Yeni Firma Ekle Modalını Aç
  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      authorizedFirstName: '',
      authorizedLastName: '',
      gsmPhone: '',
      workPhone: '',
      fax: '',
      email: '',
      city: 'Mersin',
      district: 'Akdeniz',
      billingAddress: '',
      shippingAddress: '',
      taxOffice: '',
      taxNumber: '',
      isProblematic: false,
      problemReason: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  // Firma Düzelt / Güncelle Modalını Aç
  const handleOpenEdit = (e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation();
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || '',
      authorizedFirstName: customer.authorizedFirstName || '',
      authorizedLastName: customer.authorizedLastName || '',
      authorizedPerson: customer.authorizedPerson || '',
      gsmPhone: customer.gsmPhone || customer.phone || '',
      workPhone: customer.workPhone || '',
      fax: customer.fax || '',
      email: customer.email || '',
      city: customer.city || 'Mersin',
      district: customer.district || 'Akdeniz',
      billingAddress: customer.billingAddress || customer.address || '',
      shippingAddress: customer.shippingAddress || customer.billingAddress || customer.address || '',
      taxOffice: customer.taxOffice || '',
      taxNumber: customer.taxNumber || '',
      isProblematic: customer.isProblematic ?? false,
      problemReason: customer.problemReason || '',
      notes: customer.notes || ''
    });
    setIsModalOpen(true);
  };

  // Form Kaydet (Yeni Ekleme veya Düzeltme)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert('Lütfen Firma Ticari Ünvanını giriniz.');
      return;
    }

    const authFull = `${formData.authorizedFirstName || ''} ${formData.authorizedLastName || ''}`.trim();
    const primaryPhone = formData.gsmPhone || formData.workPhone || '0(500) 000 00 00';

    if (editingCustomer) {
      // DÜZELT / GÜNCELLE
      updateCustomer(editingCustomer.id, {
        name: formData.name,
        authorizedFirstName: formData.authorizedFirstName || '',
        authorizedLastName: formData.authorizedLastName || '',
        authorizedPerson: authFull || 'Yetkili Belirtilmedi',
        gsmPhone: formData.gsmPhone || '',
        workPhone: formData.workPhone || '',
        fax: formData.fax || '',
        phone: primaryPhone,
        email: formData.email || '',
        city: formData.city || 'Mersin',
        district: formData.district || 'Akdeniz',
        address: formData.billingAddress || '',
        billingAddress: formData.billingAddress || '',
        shippingAddress: formData.shippingAddress || formData.billingAddress || '',
        taxOffice: formData.taxOffice || '',
        taxNumber: formData.taxNumber || '',
        isProblematic: formData.isProblematic ?? false,
        problemReason: formData.problemReason || '',
        notes: formData.notes || ''
      });
    } else {
      // YENİ EKLE
      addCustomer({
        name: formData.name,
        authorizedFirstName: formData.authorizedFirstName || '',
        authorizedLastName: formData.authorizedLastName || '',
        authorizedPerson: authFull || 'Yetkili Belirtilmedi',
        gsmPhone: formData.gsmPhone || '',
        workPhone: formData.workPhone || '',
        fax: formData.fax || '',
        phone: primaryPhone,
        email: formData.email || '',
        city: formData.city || 'Mersin',
        district: formData.district || 'Akdeniz',
        address: formData.billingAddress || '',
        billingAddress: formData.billingAddress || '',
        shippingAddress: formData.shippingAddress || formData.billingAddress || '',
        taxOffice: formData.taxOffice || '',
        taxNumber: formData.taxNumber || '',
        isProblematic: formData.isProblematic ?? false,
        problemReason: formData.problemReason || '',
        notes: formData.notes || ''
      });
    }

    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  const handleDeleteCustomer = (e: React.MouseEvent, id: number, name: string) => {
    e.stopPropagation();
    if (window.confirm(`"${name}" firma kaydını silmek istediğinize emin misiniz?`)) {
      deleteCustomer(id);
    }
  };

  const filteredCustomers = customers.filter(c => {
    const q = searchTerm.toLowerCase();
    const authFull = `${c.authorizedFirstName || ''} ${c.authorizedLastName || ''} ${c.authorizedPerson || ''}`.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      authFull.includes(q) ||
      c.city.toLowerCase().includes(q) ||
      (c.taxNumber && c.taxNumber.includes(q))
    );
  });

  const customerShipments = selectedCustomer
    ? shipments.filter(s => s.customerId === selectedCustomer.id)
    : [];

  const customerInvoices = selectedCustomer
    ? invoices.filter(inv => inv.customerId === selectedCustomer.id)
    : [];

  const balanceInfo = selectedCustomer
    ? getCustomerBalance(selectedCustomer.id, 'TL')
    : { alacak: 0, borc: 0, bakiye: 0 };

  // Genel Toplam Alacak Hesabı
  const totalReceivables = customers.reduce((sum, c) => {
    const bal = getCustomerBalance(c.id, 'TL');
    return sum + (bal.bakiye > 0 ? bal.bakiye : 0);
  }, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Üst Bar: Arama, Toplamlar & Yeni Firma Butonu */}
      <div
        className="glass-card"
        style={{
          padding: '14px 20px',
          background: '#ffffff',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 14,
          borderLeft: '4px solid var(--diza-red)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 280 }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
            <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: 12, top: 12 }} />
            <input
              type="text"
              className="form-control"
              placeholder="Firma ünvanı, yetkili, il/ilçe veya V.No ara..."
              style={{ paddingLeft: 36, fontSize: 13 }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
            <span style={{ color: 'var(--text-muted)' }}>
              Kayıtlı Firma & Cari: <strong style={{ color: '#0f172a' }}>{customers.length}</strong>
            </span>
            <span style={{ color: 'var(--text-muted)' }}>
              Toplam Açık Alacak: <strong style={{ color: 'var(--diza-red)', fontFamily: 'var(--font-mono)' }}>{formatCurrency(totalReceivables, 'TL')}</strong>
            </span>
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleOpenAdd} style={{ fontWeight: 800 }}>
          <Plus size={16} /> Yeni Firma & Cari Ekle
        </button>
      </div>

      {/* FİRMALAR LİSTESİ TABLOSU */}
      <div
        className="glass-card"
        style={{
          padding: 0,
          background: '#ffffff',
          overflow: 'hidden',
          border: '1.5px solid var(--border-color)',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div className="table-responsive desktop-only-table" style={{ maxHeight: 'calc(100vh - 210px)' }}>
          <table className="data-table" style={{ fontSize: 12, width: '100%' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', color: '#334155' }}>
                <th style={{ textAlign: 'center', width: 60 }}>Kod</th>
                <th style={{ textAlign: 'left' }}>Firma Ticari Ünvanı</th>
                <th style={{ textAlign: 'left' }}>Yetkili Adı Soyadı</th>
                <th style={{ textAlign: 'left' }}>İl / İlçe</th>
                <th style={{ textAlign: 'left' }}>GSM / Cep</th>
                <th style={{ textAlign: 'left' }}>İş Tel / Fax</th>
                <th style={{ textAlign: 'left' }}>Vergi Dairesi & No</th>
                <th style={{ textAlign: 'right' }}>Açık Bakiye (Alacak)</th>
                <th style={{ textAlign: 'center' }}>Durum</th>
                <th style={{ textAlign: 'center', width: 190 }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                    Aranan kriterlere uygun firma kaydı bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(c => {
                  const bal = getCustomerBalance(c.id, 'TL');
                  const authName = `${c.authorizedFirstName || ''} ${c.authorizedLastName || ''}`.trim() || c.authorizedPerson || 'Belirtilmedi';

                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCustomer(c)}
                      style={{
                        cursor: 'pointer',
                        background: c.isProblematic ? '#fff1f2' : undefined,
                        borderBottom: '1px solid #e2e8f0',
                        transition: 'background 0.15s ease'
                      }}
                      className="table-row-hover"
                    >
                      {/* Kod */}
                      <td style={{ textAlign: 'center', fontWeight: 900, color: 'var(--diza-red)', fontFamily: 'var(--font-mono)' }}>
                        {c.id}
                      </td>

                      {/* Firma Ünvanı */}
                      <td>
                        <strong style={{ color: '#0f172a', fontSize: 13 }}>{c.name}</strong>
                        {c.isProblematic && (
                          <span style={{ display: 'block', fontSize: 10, color: '#b91c1c', fontWeight: 800, marginTop: 2 }}>
                            ⚠️ {c.problemReason || 'Riskli Firma (Kara Liste)'}
                          </span>
                        )}
                      </td>

                      {/* Yetkili */}
                      <td>
                        <span style={{ color: '#334155', fontWeight: 600 }}>{authName}</span>
                      </td>

                      {/* İl / İlçe */}
                      <td>
                        <span style={{ color: '#0f172a', fontWeight: 700 }}>{c.city}</span>
                        {c.district && <span style={{ color: 'var(--text-muted)', fontSize: 11 }}> / {c.district}</span>}
                      </td>

                      {/* GSM */}
                      <td>
                        <a
                          href={`tel:${cleanPhoneForTelLink(c.gsmPhone || c.phone)}`}
                          style={{ color: 'var(--diza-red)', fontWeight: 800, textDecoration: 'none', fontFamily: 'var(--font-mono)' }}
                          onClick={e => e.stopPropagation()}
                        >
                          {c.gsmPhone || c.phone}
                        </a>
                      </td>

                      {/* İş Tel / Fax */}
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                        {c.workPhone ? <div>İş: {c.workPhone}</div> : null}
                        {c.fax ? <div>Fax: {c.fax}</div> : null}
                        {!c.workPhone && !c.fax && <span>-</span>}
                      </td>

                      {/* Vergi */}
                      <td style={{ fontSize: 11 }}>
                        <div style={{ color: '#475569' }}>{c.taxOffice || '-'}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0f172a' }}>{c.taxNumber || '-'}</div>
                      </td>

                      {/* Bakiye */}
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: 13 }}>
                        <span style={{ color: bal.bakiye > 0 ? '#b91c1c' : '#047857' }}>
                          {formatCurrency(bal.bakiye, 'TL')}
                        </span>
                      </td>

                      {/* Durum */}
                      <td style={{ textAlign: 'center' }}>
                        {c.isProblematic ? (
                          <span
                            style={{
                              background: '#fee2e2',
                              border: '1px solid #f87171',
                              color: '#991b1b',
                              fontSize: 10,
                              fontWeight: 900,
                              padding: '2px 8px',
                              borderRadius: 4
                            }}
                          >
                            KARA LİSTE
                          </span>
                        ) : (
                          <span
                            style={{
                              background: '#f0fdf4',
                              border: '1px solid #86efac',
                              color: '#166534',
                              fontSize: 10,
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: 4
                            }}
                          >
                            NORMAL
                          </span>
                        )}
                      </td>

                      {/* İşlemler (Düzelt, Ekstre, Sil) */}
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={e => handleOpenEdit(e, c)}
                            style={{ padding: '4px 8px', fontSize: 11, fontWeight: 800, color: '#1d4ed8' }}
                            title="Firma Bilgilerini Düzelt"
                          >
                            <Edit size={13} /> Düzelt
                          </button>

                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedCustomer(c);
                            }}
                            style={{ padding: '4px 8px', fontSize: 11, fontWeight: 800 }}
                            title="Ekstre ve Hareketler"
                          >
                            <FileText size={13} /> Ekstre
                          </button>

                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={e => handleDeleteCustomer(e, c.id, c.name)}
                            style={{ padding: '4px 8px', fontSize: 11, color: '#ef4444' }}
                            title="Firmayı Sil"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobilde Dokunmatik Firma & Cari Kartları */}
        <div className="mobile-only-cards" style={{ padding: '12px' }}>
          {filteredCustomers.map(c => {
            const bal = getCustomerBalance(c.id, 'TL');
            const authName = `${c.authorizedFirstName || ''} ${c.authorizedLastName || ''}`.trim() || c.authorizedPerson || 'Belirtilmedi';

            return (
              <div
                key={c.id}
                className="mobile-action-card"
                style={{
                  borderLeft: c.isProblematic ? '4px solid #ef4444' : bal.bakiye > 0 ? '4px solid var(--diza-red)' : '4px solid #10b981'
                }}
              >
                <div className="card-top-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 900, color: 'var(--diza-red)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                      #{c.id}
                    </span>
                    <strong style={{ fontSize: 14, color: '#0f172a' }}>{c.name}</strong>
                  </div>
                  {c.isProblematic ? (
                    <span className="card-status-badge expense">RİSKLİ</span>
                  ) : (
                    <span className="card-status-badge on-road">{c.city}</span>
                  )}
                </div>

                <div style={{ fontSize: 12, color: '#475569', margin: '2px 0' }}>
                  Yetkili: <strong>{authName}</strong> • {c.city} {c.district ? `/ ${c.district}` : ''}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '4px 0' }}>
                  <a
                    href={`tel:${cleanPhoneForTelLink(c.gsmPhone || c.phone)}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      color: 'var(--diza-red)',
                      fontWeight: 800,
                      fontSize: 12.5,
                      textDecoration: 'none'
                    }}
                  >
                    <Phone size={13} /> {c.gsmPhone || c.phone}
                  </a>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 10.5, color: '#64748b' }}>Açık Bakiye: </span>
                    <strong
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 14,
                        color: bal.bakiye > 0 ? '#b91c1c' : '#059669'
                      }}
                    >
                      {formatCurrency(bal.bakiye, 'TL')}
                    </strong>
                  </div>
                </div>

                <div className="card-bottom-row" style={{ gap: 8 }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={e => handleOpenEdit(e, c)}
                    style={{ flex: 1, padding: '8px 10px', fontSize: 12, fontWeight: 800, color: '#1d4ed8' }}
                  >
                    <Edit size={14} /> Düzelt
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setSelectedCustomer(c)}
                    style={{ flex: 1, padding: '8px 10px', fontSize: 12, fontWeight: 900 }}
                  >
                    <FileText size={14} /> Ekstre & Hareketler
                  </button>
                </div>
              </div>
            );
          })}

          {filteredCustomers.length === 0 && (
            <div className="mobile-empty-card">
              Aranan kriterlere uygun firma kaydı bulunamadı.
            </div>
          )}
        </div>

        {/* Tablo Alt Bilgi Çubuğu */}
        <div
          style={{
            padding: '10px 20px',
            background: '#f8fafc',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 12,
            color: 'var(--text-muted)'
          }}
        >
          <span>Listelenen: <strong style={{ color: '#0f172a' }}>{filteredCustomers.length}</strong> Firma</span>
          <span>* Firma bilgilerini düzenlemek için <strong>"Düzelt"</strong> butonunu, hesap hareketleri için <strong>"Ekstre"</strong> butonunu kullanabilirsiniz.</span>
        </div>
      </div>

      {/* 1. YENİ FİRMA EKLE / DÜZELT MODALI */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div
            className="modal-card"
            style={{
              maxWidth: 860,
              width: '95%',
              background: '#ffffff',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-xl)',
              overflow: 'hidden',
              border: '1.5px solid var(--border-color)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Başlık */}
            <div
              className="modal-header"
              style={{
                background: '#ffffff',
                borderBottom: '2px solid var(--border-color)',
                padding: '14px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 10
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: editingCustomer ? '#eff6ff' : 'var(--diza-red-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: editingCustomer ? '#1d4ed8' : 'var(--diza-red)',
                    flexShrink: 0
                  }}
                >
                  {editingCustomer ? <Edit size={18} /> : <Building size={18} />}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {editingCustomer ? `Firma Düzelt: ${editingCustomer.name}` : 'Yeni Firma & Cari Kartı Ekle'}
                  </h3>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                    {editingCustomer ? 'Firma bilgileri, yetkili, il/ilçe ve telefon güncellemeleri' : 'Ticari ünvan, 81 il/ilçe, fatura ve iletişim tanımları'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsModalOpen(false)}
                style={{ padding: '6px 8px', flexShrink: 0 }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div
                className="modal-body"
                style={{
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  maxHeight: '75vh',
                  overflowY: 'auto'
                }}
              >
                {/* 1. BLOK: FİRMA ÜNVANI */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: 11, fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    FİRMA TİCARİ ÜNVANI <span style={{ color: 'var(--diza-red)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Örn: Toroslar Demir Çelik Sanayi ve Tic. A.Ş."
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    style={{ fontSize: 14, fontWeight: 700 }}
                    required
                  />
                </div>

                {/* 2. BLOK: YETKİLİ ADI & SOYADI */}
                <div className="customer-grid-row-2">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: 11, fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      YETKİLİ ADI
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Örn: Hasan"
                      value={formData.authorizedFirstName || ''}
                      onChange={e => setFormData({ ...formData, authorizedFirstName: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: 11, fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      YETKİLİ SOYADI
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Örn: Yılmaz"
                      value={formData.authorizedLastName || ''}
                      onChange={e => setFormData({ ...formData, authorizedLastName: e.target.value })}
                    />
                  </div>
                </div>

                {/* 3. BLOK: 81 İL VE TÜM İLÇELER DROPDOWNLARI */}
                <div
                  className="customer-grid-row-2"
                  style={{
                    background: '#f8fafc',
                    padding: 14,
                    borderRadius: 'var(--radius-lg)',
                    border: '1.5px solid var(--border-color)'
                  }}
                >
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: 11, fontWeight: 900, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MapPin size={13} color="#1d4ed8" />
                      İL (81 ŞEHİR)
                    </label>
                    <select
                      className="form-control"
                      value={formData.city || 'Mersin'}
                      onChange={e => handleCityChange(e.target.value)}
                      style={{ fontWeight: 800, color: '#0f172a', background: '#fff' }}
                      required
                    >
                      {CITIES_LIST.map(city => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: 11, fontWeight: 900, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      İLÇE (TÜM İLÇELER)
                    </label>
                    <select
                      className="form-control"
                      value={formData.district || availableDistricts[0] || 'Akdeniz'}
                      onChange={e => setFormData({ ...formData, district: e.target.value })}
                      style={{ fontWeight: 800, color: '#0f172a', background: '#fff' }}
                      required
                    >
                      {availableDistricts.map(dist => (
                        <option key={dist} value={dist}>
                          {dist}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 4. BLOK: 0(XXX) XXX XX XX TELEFONLAR */}
                <div className="customer-grid-row-3">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: 11, fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      GSM / CEP <span style={{ color: 'var(--diza-red)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="0(541) 608 53 44"
                      value={formData.gsmPhone || ''}
                      onChange={e => setFormData({ ...formData, gsmPhone: formatPhoneNumber(e.target.value) })}
                      style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#0f172a' }}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: 11, fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      İŞ TELEFONU
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="0(324) 233 00 00"
                      value={formData.workPhone || ''}
                      onChange={e => setFormData({ ...formData, workPhone: formatPhoneNumber(e.target.value) })}
                      style={{ fontFamily: 'var(--font-mono)' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: 11, fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      FAX / BELGEGEÇER
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="0(324) 233 00 01"
                      value={formData.fax || ''}
                      onChange={e => setFormData({ ...formData, fax: formatPhoneNumber(e.target.value) })}
                      style={{ fontFamily: 'var(--font-mono)' }}
                    />
                  </div>
                </div>

                {/* 5. BLOK: E-POSTA, VERGİ DAİRESİ, VERGİ NO / TCKN */}
                <div className="customer-grid-row-3">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: 11, fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      E-POSTA
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="muhasebe@firma.com"
                      value={formData.email || ''}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: 11, fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      VERGİ DAİRESİ
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Uray V.D."
                      value={formData.taxOffice || ''}
                      onChange={e => setFormData({ ...formData, taxOffice: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: 11, fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      VERGİ NO / TCKN
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="1234567890"
                      value={formData.taxNumber || ''}
                      onChange={e => setFormData({ ...formData, taxNumber: e.target.value })}
                      style={{ fontFamily: 'var(--font-mono)' }}
                    />
                  </div>
                </div>

                {/* 6. BLOK: FATURA ADRESİ */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: 11, fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    FATURA ADRESİ <span style={{ color: 'var(--diza-red)' }}>*</span>
                  </label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Resmî e-fatura, posta ve zarf baskısında kullanılacak açık fatura adresi..."
                    value={formData.billingAddress || ''}
                    onChange={e => setFormData({ ...formData, billingAddress: e.target.value })}
                    required
                  />
                </div>

                {/* 7. BLOK: KARGO ADRESİ / SEVK ADRESİ */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: 11, fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    KARGO ADRESİ / SEVK ADRESİ
                  </label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Yük teslimatı, kargo, antrepo veya depo teslim adresi..."
                    value={formData.shippingAddress || ''}
                    onChange={e => setFormData({ ...formData, shippingAddress: e.target.value })}
                  />
                </div>

                {/* 8. BLOK: RİSKLİ / KARA LİSTE FİRMA UYARISI */}
                <div
                  style={{
                    padding: '12px 16px',
                    background: '#fef2f2',
                    border: '1.5px solid #fecaca',
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8
                  }}
                >
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 900, color: '#b91c1c', fontSize: 12 }}>
                    <input
                      type="checkbox"
                      checked={formData.isProblematic ?? false}
                      onChange={e => setFormData({ ...formData, isProblematic: e.target.checked })}
                      style={{ width: 17, height: 17, accentColor: '#b91c1c' }}
                    />
                    Bu firmayı Problemli / Riskli Firma Listesine (Kara Liste) al
                  </label>

                  {formData.isProblematic && (
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Risk uyarısı nedeni (Örn: Çeki karşılıksız çıktı, peşin ödeme şartı...)"
                      value={formData.problemReason || ''}
                      onChange={e => setFormData({ ...formData, problemReason: e.target.value })}
                      style={{ fontSize: 12, background: '#fff', border: '1.5px solid #ef4444' }}
                      required
                    />
                  )}
                </div>
              </div>

              {/* Modal Alt Butonları */}
              <div
                className="modal-footer"
                style={{
                  background: '#f8fafc',
                  borderTop: '2px solid var(--border-color)',
                  padding: '12px 18px',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 10,
                  flexWrap: 'wrap'
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  style={{ fontWeight: 800 }}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ fontWeight: 900, padding: '8px 24px', fontSize: 14 }}
                >
                  {editingCustomer ? 'Değişiklikleri Güncelle' : 'Firmayı Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. FİRMA DETAYI & HESAP EKSTRESİ MODAL */}
      {selectedCustomer && (
        <div className="modal-overlay" onClick={() => setSelectedCustomer(null)}>
          <div className="modal-card" style={{ maxWidth: 1080, width: '96%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: 17, color: '#0f172a' }}>{selectedCustomer.name} — Firma Hesap Ekstresi</h3>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Yetkili: <strong>{`${selectedCustomer.authorizedFirstName || ''} ${selectedCustomer.authorizedLastName || ''}`.trim() || selectedCustomer.authorizedPerson}</strong> | GSM: {selectedCustomer.gsmPhone || selectedCustomer.phone} | İş: {selectedCustomer.workPhone || '-'} | Fax: {selectedCustomer.fax || '-'}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                  Fatura Adresi: {selectedCustomer.billingAddress || selectedCustomer.address} | Kargo Adresi: {selectedCustomer.shippingAddress || '-'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={(e) => {
                    setSelectedCustomer(null);
                    handleOpenEdit(e, selectedCustomer);
                  }}
                  style={{ color: '#1d4ed8' }}
                >
                  <Edit size={14} /> Bilgileri Düzelt
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setSelectedCustomer(null)}>
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="modal-body">
              {/* Bakiye Özeti */}
              <div
                className="customer-grid-row-3"
                style={{
                  marginBottom: 20,
                  background: '#f8fafc',
                  padding: 14,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>Toplam Kesilen Fatura:</span>
                  <h4 style={{ color: '#1d4ed8', fontSize: 16, fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                    {formatCurrency(balanceInfo.alacak, 'TL')}
                  </h4>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>Tahsil Edilen Tutar:</span>
                  <h4 style={{ color: '#047857', fontSize: 16, fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                    {formatCurrency(balanceInfo.borc, 'TL')}
                  </h4>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>Kalan Bakiye (Alacak):</span>
                  <h4 style={{ color: balanceInfo.bakiye > 0 ? '#b91c1c' : '#047857', fontSize: 18, fontWeight: 900, fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                    {formatCurrency(balanceInfo.bakiye, 'TL')}
                  </h4>
                </div>
              </div>

              {/* Düzenlenen Faturalar */}
              <h4 style={{ fontSize: 14, marginBottom: 10, color: '#0f172a' }}>Düzenlenen Faturalar ({customerInvoices.length})</h4>
              
              {/* Masaüstü Fatura Tablosu */}
              <div className="table-responsive desktop-only-table" style={{ marginBottom: 20 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Fatura No</th>
                      <th>Tarih</th>
                      <th>Matrah</th>
                      <th>KDV</th>
                      <th>Tevkifat</th>
                      <th>Genel Toplam</th>
                      <th>Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerInvoices.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Kayıtlı fatura bulunmuyor.</td></tr>
                    ) : (
                      customerInvoices.map(inv => (
                        <tr key={inv.id}>
                          <td style={{ color: 'var(--diza-red)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{inv.invoiceNo}</td>
                          <td>{formatDate(inv.invoiceDate)}</td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(inv.subTotal, inv.currency)}</td>
                          <td style={{ color: '#1d4ed8', fontFamily: 'var(--font-mono)' }}>{formatCurrency(inv.vatTotal, inv.currency)}</td>
                          <td style={{ color: '#b45309', fontFamily: 'var(--font-mono)' }}>-{formatCurrency(inv.withholdingTotal, inv.currency)}</td>
                          <td style={{ fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{formatCurrency(inv.grandTotal, inv.currency)}</td>
                          <td><span className={`badge-status ${inv.paymentStatus === 'ODENDI' ? 'badge-teslim' : 'badge-fatura'}`}>{inv.paymentStatus}</span></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobilde Fatura Kartları */}
              <div className="mobile-only-cards" style={{ marginBottom: 20 }}>
                {customerInvoices.map(inv => (
                  <div key={inv.id} className="mobile-action-card">
                    <div className="card-top-row">
                      <strong style={{ color: 'var(--diza-red)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                        {inv.invoiceNo}
                      </strong>
                      <span className={`badge-status ${inv.paymentStatus === 'ODENDI' ? 'badge-teslim' : 'badge-fatura'}`}>
                        {inv.paymentStatus}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      Tarih: {formatDate(inv.invoiceDate)} • KDV: {formatCurrency(inv.vatTotal, inv.currency)}
                    </div>
                    <div className="card-bottom-row">
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#334155' }}>Fatura Toplamı:</span>
                      <strong style={{ fontSize: 15, fontFamily: 'var(--font-mono)', color: '#0f172a' }}>
                        {formatCurrency(inv.grandTotal, inv.currency)}
                      </strong>
                    </div>
                  </div>
                ))}
                {customerInvoices.length === 0 && (
                  <div className="mobile-empty-card">Kayıtlı fatura bulunmuyor.</div>
                )}
              </div>

              {/* Gerçekleşen Sevkiyatlar */}
              <h4 style={{ fontSize: 14, marginBottom: 10, color: '#0f172a' }}>Sevkiyat Hareketleri ({customerShipments.length})</h4>
              
              {/* Masaüstü Sevkiyat Tablosu */}
              <div className="table-responsive desktop-only-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tarih</th>
                      <th>Takip No</th>
                      <th>Güzergah</th>
                      <th>Plaka</th>
                      <th>Mal Cinsi</th>
                      <th>Miktar</th>
                      <th>Navlun Tutarı</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerShipments.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Sevkiyat kaydı bulunmuyor.</td></tr>
                    ) : (
                      customerShipments.map(s => (
                        <tr key={s.id}>
                          <td>{formatDate(s.loadingDate)}</td>
                          <td style={{ color: 'var(--diza-red)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{s.shipmentNo}</td>
                          <td>{s.loadingLocation} ➔ {s.unloadingLocation}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{s.vehiclePlate}</td>
                          <td>{s.goodsType}</td>
                          <td>{s.quantity} {s.unit}</td>
                          <td style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--diza-red)' }}>{formatCurrency(s.netPayableAmount, s.currency)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobilde Sevkiyat Kartları */}
              <div className="mobile-only-cards">
                {customerShipments.map(s => (
                  <div key={s.id} className="mobile-action-card">
                    <div className="card-top-row">
                      <span style={{ color: 'var(--diza-red)', fontWeight: 800, fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>
                        {s.shipmentNo}
                      </span>
                      <span className="card-date-tag">{formatDate(s.loadingDate)}</span>
                    </div>
                    <div className="card-route-row" style={{ margin: '3px 0' }}>
                      <span className="from-loc">{s.loadingLocation}</span>
                      <span className="route-arrow">➔</span>
                      <span className="to-loc">{s.unloadingLocation}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      {s.goodsType} ({s.quantity} {s.unit}) • {s.vehiclePlate || 'Araçsız'}
                    </div>
                    <div className="card-bottom-row">
                      <span style={{ fontSize: 11, color: '#334155' }}>Navlun:</span>
                      <strong style={{ fontSize: 14, fontFamily: 'var(--font-mono)', color: 'var(--diza-red)' }}>
                        {formatCurrency(s.netPayableAmount, s.currency)}
                      </strong>
                    </div>
                  </div>
                ))}
                {customerShipments.length === 0 && (
                  <div className="mobile-empty-card">Sevkiyat kaydı bulunmuyor.</div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedCustomer(null)}>
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
