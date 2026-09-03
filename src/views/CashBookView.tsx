import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CashEntry, CurrencyType } from '../types';
import {
  Wallet,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  X,
  Search,
  Filter,
  Trash2
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/numberToWords';

export const CashBookView: React.FC<{
  isOpenNewModal: boolean;
  onCloseNewModal: () => void;
  onOpenNewModal: () => void;
}> = ({ isOpenNewModal, onCloseNewModal, onOpenNewModal }) => {
  const {
    cashEntries,
    vehicles,
    customers,
    addCashEntry,
    deleteCashEntry,
    getCashBalance
  } = useApp();

  const [activeCurrency, setActiveCurrency] = useState<CurrencyType>('TL');
  const [filterType, setFilterType] = useState<string>('ALL'); // ALL, GIRIS, CIKIS

  // Yeni Kasa Hareketi Form State
  const [formData, setFormData] = useState({
    type: 'GIRIS' as 'GIRIS' | 'CIKIS',
    category: 'Müşteri Tahsilatı',
    amount: 1000,
    currency: 'TL' as CurrencyType,
    description: '',
    recipientOrSender: '',
    vehiclePlate: '',
    customerId: customers[0]?.id || 101,
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  });

  const currencyCash = cashEntries.filter(c => c.currency === activeCurrency);
  const totalIn = currencyCash.filter(c => c.type === 'GIRIS').reduce((s, c) => s + c.amount, 0);
  const totalOut = currencyCash.filter(c => c.type === 'CIKIS').reduce((s, c) => s + c.amount, 0);
  const netBalance = getCashBalance(activeCurrency);

  const filteredEntries = currencyCash.filter(c => {
    if (filterType === 'ALL') return true;
    return c.type === filterType;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    addCashEntry({
      date: formData.date,
      time: formData.time,
      type: formData.type,
      category: formData.category,
      amount: Number(formData.amount),
      currency: formData.currency,
      description: formData.description || `${formData.category} işlemi`,
      recipientOrSender: formData.recipientOrSender || (formData.type === 'GIRIS' ? 'Müşteri / Cari' : 'Şoför / Harcama'),
      vehiclePlate: formData.vehiclePlate || undefined,
      customerId: formData.customerId ? Number(formData.customerId) : undefined
    });

    onCloseNewModal();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 1. Üst Kasa Seçim ve Bakiye Kartları */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        {/* Canlı Bakiye */}
        <div className="glass-card" style={{ borderLeft: '4px solid var(--diza-red)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>{activeCurrency} KASA MEVCUDU</p>
              <h3 style={{ fontSize: 26, fontWeight: 900, fontFamily: 'var(--font-mono)', color: netBalance >= 0 ? '#10b981' : '#ef4444', marginTop: 4 }}>
                {formatCurrency(netBalance, activeCurrency)}
              </h3>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['TL', 'USD', 'EUR'] as CurrencyType[]).map(curr => (
                <button
                  key={curr}
                  className={`btn btn-sm ${activeCurrency === curr ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => {
                    setActiveCurrency(curr);
                    setFormData(prev => ({ ...prev, currency: curr }));
                  }}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Toplam Giriş */}
        <div className="glass-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>TOPLAM TAHSİLAT (GİRİŞ)</p>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                +{formatCurrency(totalIn, activeCurrency)}
              </h3>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowDownRight size={20} color="#10b981" />
            </div>
          </div>
        </div>

        {/* Toplam Çıkış */}
        <div className="glass-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>TOPLAM ÖDEME & AVANS (ÇIKIŞ)</p>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: '#f87171', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                -{formatCurrency(totalOut, activeCurrency)}
              </h3>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowUpRight size={20} color="#ef4444" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Filtre ve Yeni Ekle Barı */}
      <div className="glass-card" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['ALL', 'GIRIS', 'CIKIS'].map(st => (
            <button
              key={st}
              className={`btn btn-sm ${filterType === st ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterType(st)}
            >
              {st === 'ALL' ? 'Tüm Hareketler' : st === 'GIRIS' ? 'Girişler (+)' : 'Çıkışlar (-)'}
            </button>
          ))}
        </div>

        <button className="btn btn-primary" onClick={onOpenNewModal}>
          <Plus size={16} /> Yeni Kasa Hareketi
        </button>
      </div>

      {/* 3. Kasa Defteri Tablosu */}
      <div className="table-responsive desktop-only-table">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tarih & Saat</th>
              <th>Tür</th>
              <th>Kategori</th>
              <th>Kimden / Kime</th>
              <th>Araç Plaka</th>
              <th>Açıklama</th>
              <th>Tutar</th>
              <th style={{ textAlign: 'right' }}>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>Kasa hareketi bulunamadı.</td></tr>
            ) : (
              filteredEntries.map(c => (
                <tr key={c.id}>
                  <td>
                    <strong>{formatDate(c.date)}</strong>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 6 }}>{c.time}</span>
                  </td>
                  <td>
                    <span className={`badge-status ${c.type === 'GIRIS' ? 'badge-teslim' : 'badge-fatura'}`}>
                      {c.type === 'GIRIS' ? 'GİRİŞ' : 'ÇIKIŞ'}
                    </span>
                  </td>
                  <td><strong>{c.category}</strong></td>
                  <td>{c.recipientOrSender}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: '#60a5fa' }}>{c.vehiclePlate || '-'}</td>
                  <td>{c.description}</td>
                  <td>
                    <strong
                      style={{
                        fontSize: 14,
                        fontFamily: 'var(--font-mono)',
                        color: c.type === 'GIRIS' ? '#10b981' : '#ef4444'
                      }}
                    >
                      {c.type === 'GIRIS' ? '+' : '-'} {formatCurrency(c.amount, c.currency)}
                    </strong>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => deleteCashEntry(c.id)}
                      title="Sil"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobilde Dokunmatik Kasa Kartları */}
      <div className="mobile-only-cards">
        {filteredEntries.map(c => (
          <div
            key={c.id}
            className="mobile-action-card"
            style={{
              borderLeft: c.type === 'GIRIS' ? '4px solid #10b981' : '4px solid #ef4444'
            }}
          >
            <div className="card-top-row">
              <span className={`badge-status ${c.type === 'GIRIS' ? 'badge-teslim' : 'badge-fatura'}`}>
                {c.type === 'GIRIS' ? '✓ TAHSİLAT (GİRİŞ)' : '↗ TEDİYE (ÇIKIŞ)'}
              </span>
              <span className="card-date-tag">{formatDate(c.date)} {c.time}</span>
            </div>

            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', margin: '4px 0 2px 0' }}>
              {c.category}
            </div>

            <div style={{ fontSize: 12, color: '#475569' }}>
              <strong>İlgili:</strong> {c.recipientOrSender} {c.vehiclePlate ? `• Plaka: ${c.vehiclePlate}` : ''}
            </div>

            {c.description && (
              <div style={{ fontSize: 11.5, color: '#64748b', fontStyle: 'italic', margin: '3px 0' }}>
                {c.description}
              </div>
            )}

            <div className="card-bottom-row" style={{ marginTop: 6 }}>
              <div>
                <strong
                  style={{
                    fontSize: 16,
                    fontFamily: 'var(--font-mono)',
                    color: c.type === 'GIRIS' ? '#10b981' : '#ef4444'
                  }}
                >
                  {c.type === 'GIRIS' ? '+' : '-'} {formatCurrency(c.amount, c.currency)}
                </strong>
              </div>

              <button
                className="btn btn-danger btn-sm"
                onClick={() => deleteCashEntry(c.id)}
                title="Hareketi Sil"
                style={{ padding: '5px 9px' }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}

        {filteredEntries.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
            Kasa hareketi bulunamadı.
          </div>
        )}
      </div>

      {/* 4. Yeni Kasa Hareketi Modal */}
      {isOpenNewModal && (
        <div className="modal-overlay" onClick={onCloseNewModal}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Kasa Giriş / Çıkış Hareketi Ekle</h3>
              <button className="btn btn-secondary btn-sm" onClick={onCloseNewModal}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                  <div className="form-group">
                    <label>İşlem Türü</label>
                    <select
                      className="form-control"
                      value={formData.type}
                      onChange={e => {
                        const t = e.target.value as 'GIRIS' | 'CIKIS';
                        setFormData({
                          ...formData,
                          type: t,
                          category: t === 'GIRIS' ? 'Müşteri Tahsilatı' : 'Şoför Avansı'
                        });
                      }}
                    >
                      <option value="GIRIS">Giriş (+) [Tahsilat / Sermaye]</option>
                      <option value="CIKIS">Çıkış (-) [Avans / Masraf / Ödeme]</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Kategori</label>
                    <select
                      className="form-control"
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                    >
                      {formData.type === 'GIRIS' ? (
                        <>
                          <option value="Müşteri Tahsilatı">Müşteri Tahsilatı</option>
                          <option value="Devreden Kasa">Devreden Kasa</option>
                          <option value="Banka Çek Tahsilatı">Banka Çek Tahsilatı</option>
                          <option value="Diğer Gelir">Diğer Gelir</option>
                        </>
                      ) : (
                        <>
                          <option value="Şoför Avansı">Şoför Avansı</option>
                          <option value="Mazot / Yakıt Gideri">Mazot / Yakıt Gideri</option>
                          <option value="Araç Tamir & Bakım">Araç Tamir & Bakım</option>
                          <option value="Yemek & Harcırah">Yemek & Harcırah</option>
                          <option value="Ofis / Genel Gider">Ofis / Genel Gider</option>
                          <option value="Vergi / Sigorta">Vergi / Sigorta</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Tutar</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={formData.amount}
                      onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Para Birimi</label>
                    <select
                      className="form-control"
                      value={formData.currency}
                      onChange={e => setFormData({ ...formData, currency: e.target.value as CurrencyType })}
                    >
                      <option value="TL">TL (Türk Lirası)</option>
                      <option value="USD">USD (Dolar)</option>
                      <option value="EUR">EUR (Euro)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Tarih</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.date}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>İlgili Araç (Opsiyonel)</label>
                    <select
                      className="form-control"
                      value={formData.vehiclePlate}
                      onChange={e => setFormData({ ...formData, vehiclePlate: e.target.value })}
                    >
                      <option value="">Araç Seçilmedi</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.plate}>
                          {v.plate} ({v.driverName})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: 12 }}>
                  <label>Kimden Alındı / Kime Ödendi</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Örn: Ahmet Yılmaz veya Kayseri Profil"
                    value={formData.recipientOrSender}
                    onChange={e => setFormData({ ...formData, recipientOrSender: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Açıklama</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="İşlem detayı..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onCloseNewModal}>
                  İptal
                </button>
                <button type="submit" className="btn btn-primary">
                  Hareketi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
