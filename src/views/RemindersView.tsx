import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ReminderCheck, CurrencyType } from '../types';
import {
  Clock,
  Plus,
  CheckCircle,
  Calendar,
  X,
  AlertTriangle,
  Building,
  Trash2,
  DollarSign
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/numberToWords';

export const RemindersView: React.FC = () => {
  const {
    reminders,
    customers,
    addReminder,
    updateReminderStatus,
    deleteReminder,
    addCashEntry
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterDirection, setFilterDirection] = useState<'ALL' | 'ALACAK' | 'BORC'>('ALL');

  const [formData, setFormData] = useState<Partial<ReminderCheck>>({
    type: 'CEK',
    direction: 'ALACAK',
    dueDate: new Date().toISOString().split('T')[0],
    amount: 10000,
    currency: 'TL',
    bankName: 'Garanti BBVA',
    checkNo: '',
    issuer: '',
    customerId: customers[0]?.id || 101,
    status: 'BEKLIYOR',
    notes: ''
  });

  const filtered = reminders.filter(r => {
    if (filterDirection === 'ALL') return true;
    return r.direction === filterDirection;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find(c => c.id === Number(formData.customerId));

    addReminder({
      type: formData.type || 'CEK',
      direction: formData.direction || 'ALACAK',
      dueDate: formData.dueDate || new Date().toISOString().split('T')[0],
      amount: Number(formData.amount) || 0,
      currency: formData.currency || 'TL',
      bankName: formData.bankName,
      checkNo: formData.checkNo,
      issuer: formData.issuer || cust?.name || 'Keşideci',
      customerId: cust?.id,
      customerName: cust?.name,
      status: 'BEKLIYOR',
      notes: formData.notes
    });

    setIsModalOpen(false);
  };

  const handleCollectToCash = (rem: ReminderCheck) => {
    // Kasa hareketine aktar ve durumu güncelle
    addCashEntry({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      type: rem.direction === 'ALACAK' ? 'GIRIS' : 'CIKIS',
      category: rem.type === 'CEK' ? 'Banka Çek Tahsilatı' : 'Senet Tahsilatı',
      amount: rem.amount,
      currency: rem.currency,
      description: `${rem.issuer} - ${rem.checkNo || ''} nolu ${rem.type} ${rem.direction === 'ALACAK' ? 'tahsilatı' : 'ödemesi'}`,
      recipientOrSender: rem.issuer,
      customerId: rem.customerId
    });

    updateReminderStatus(rem.id, rem.direction === 'ALACAK' ? 'TAHSIL_EDILDI' : 'ODENDI');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Üst Bar */}
      <div className="glass-card" style={{ padding: '14px 18px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Çek / Senet & Vade Hatırlatıcı ({reminders.length} Evrak)</h3>
          <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: 0 }}>Müşteriden alınan çekler, firmamızın verdiği senetler ve vadeli ödemeler</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(['ALL', 'ALACAK', 'BORC'] as const).map(dir => (
              <button
                key={dir}
                className={`btn btn-sm ${filterDirection === dir ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterDirection(dir)}
              >
                {dir === 'ALL' ? 'Tümü' : dir === 'ALACAK' ? 'Alınan Çekler' : 'Verilen Senetler'}
              </button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Yeni Evrak Ekle
          </button>
        </div>
      </div>

      {/* Evrak Tablosu */}
      <div className="table-responsive desktop-only-table">
        <table className="data-table">
          <thead>
            <tr>
              <th>Vade Tarihi</th>
              <th>Evrak Türü</th>
              <th>Yön</th>
              <th>Keşideci / Müşteri</th>
              <th>Banka & Çek No</th>
              <th>Tutar</th>
              <th>Durum</th>
              <th style={{ textAlign: 'right' }}>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>Kayıt bulunamadı.</td></tr>
            ) : (
              filtered.map(r => (
                <tr key={r.id}>
                  <td>
                    <strong style={{ color: '#0f172a', fontSize: 13 }}>{formatDate(r.dueDate)}</strong>
                  </td>
                  <td>
                    <span className="badge-status badge-siparis">{r.type}</span>
                  </td>
                  <td>
                    <span className={`badge-status ${r.direction === 'ALACAK' ? 'badge-teslim' : 'badge-fatura'}`}>
                      {r.direction === 'ALACAK' ? 'TAHSİLAT' : 'ÖDEME'}
                    </span>
                  </td>
                  <td>
                    <strong>{r.issuer}</strong>
                    {r.customerName && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Cari: {r.customerName}</div>}
                  </td>
                  <td>
                    <div>{r.bankName || '-'}</div>
                    <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>{r.checkNo || 'No Yok'}</div>
                  </td>
                  <td>
                    <strong style={{ fontSize: 15, fontFamily: 'var(--font-mono)', color: '#fff' }}>
                      {formatCurrency(r.amount, r.currency)}
                    </strong>
                  </td>
                  <td>
                    <span
                      className={`badge-status ${
                        r.status === 'BEKLIYOR' ? 'badge-yolda' :
                        r.status === 'TAHSIL_EDILDI' || r.status === 'ODENDI' ? 'badge-teslim' : 'badge-risk'
                      }`}
                    >
                      {r.status === 'BEKLIYOR' ? 'BEKLİYOR' :
                       r.status === 'TAHSIL_EDILDI' ? 'TAHSİL EDİLDİ' :
                       r.status === 'ODENDI' ? 'ÖDENDİ' : 'KARŞILIKSIZ'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                      {r.status === 'BEKLIYOR' && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleCollectToCash(r)}
                          title="Tahsil Et ve Kasaya İşle"
                        >
                          <CheckCircle size={13} /> {r.direction === 'ALACAK' ? 'Kasaya Al' : 'Öde'}
                        </button>
                      )}
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => deleteReminder(r.id)}
                        title="Sil"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobilde Dokunmatik Çek & Senet Kartları */}
      <div className="mobile-only-cards">
        {filtered.map(r => (
          <div
            key={r.id}
            className="mobile-action-card"
            style={{
              borderLeft: r.direction === 'ALACAK' ? '4px solid #10b981' : '4px solid #ef4444'
            }}
          >
            <div className="card-top-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="badge-status badge-siparis">{r.type}</span>
                <span className={`badge-status ${r.direction === 'ALACAK' ? 'badge-teslim' : 'badge-fatura'}`}>
                  {r.direction === 'ALACAK' ? 'TAHSİLAT' : 'ÖDEME'}
                </span>
              </div>
              <span className="card-date-tag">Vade: {formatDate(r.dueDate)}</span>
            </div>

            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', margin: '4px 0 2px 0' }}>
              {r.issuer}
            </div>

            {r.customerName && (
              <div style={{ fontSize: 11.5, color: '#64748b' }}>
                Cari Hesap: <strong>{r.customerName}</strong>
              </div>
            )}

            <div style={{ fontSize: 11.5, color: '#475569', margin: '2px 0' }}>
              {r.bankName || 'Banka Belirtilmemiş'} {r.checkNo ? `• Çek No: ${r.checkNo}` : ''}
            </div>

            <div className="card-bottom-row" style={{ marginTop: 6 }}>
              <div>
                <strong style={{ fontSize: 16, fontFamily: 'var(--font-mono)', color: '#0f172a' }}>
                  {formatCurrency(r.amount, r.currency)}
                </strong>
                <div style={{ marginTop: 2 }}>
                  <span
                    className={`badge-status ${
                      r.status === 'BEKLIYOR' ? 'badge-yolda' :
                      r.status === 'TAHSIL_EDILDI' || r.status === 'ODENDI' ? 'badge-teslim' : 'badge-risk'
                    }`}
                  >
                    {r.status === 'BEKLIYOR' ? 'BEKLİYOR' :
                     r.status === 'TAHSIL_EDILDI' ? 'TAHSİL EDİLDİ' :
                     r.status === 'ODENDI' ? 'ÖDENDİ' : 'KARŞILIKSIZ'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                {r.status === 'BEKLIYOR' && (
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => handleCollectToCash(r)}
                    style={{ padding: '6px 10px', fontSize: 11.5 }}
                    title="Tahsil Et ve Kasaya İşle"
                  >
                    <CheckCircle size={13} /> {r.direction === 'ALACAK' ? 'Kasaya Al' : 'Öde'}
                  </button>
                )}
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => deleteReminder(r.id)}
                  style={{ padding: '6px 8px' }}
                  title="Sil"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
            Kayıt bulunamadı.
          </div>
        )}
      </div>

      {/* Yeni Çek / Senet Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Yeni Vadeli Çek / Senet Kaydı</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                  <div className="form-group">
                    <label>Evrak Türü</label>
                    <select
                      className="form-control"
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                    >
                      <option value="CEK">Banka Çeki</option>
                      <option value="SENET">Senet (Borç/Alacak Senedi)</option>
                      <option value="VADELI_HESAP">Vadeli Cari Taahhüt</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Yön</label>
                    <select
                      className="form-control"
                      value={formData.direction}
                      onChange={e => setFormData({ ...formData, direction: e.target.value as any })}
                    >
                      <option value="ALACAK">Müşteriden Alınan (Alacak / Tahsilat)</option>
                      <option value="BORC">Firmamızın Verdiği (Borç / Ödeme)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Vade Tarihi</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.dueDate}
                      onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                      required
                    />
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
                    <label>Banka Adı & Şube</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Örn: Garanti BBVA Mersin Şb."
                      value={formData.bankName}
                      onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Çek / Senet No</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Örn: 0098451"
                      value={formData.checkNo}
                      onChange={e => setFormData({ ...formData, checkNo: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Keşideci / Borçlu Firma</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Çeki yazan firma adı"
                      value={formData.issuer}
                      onChange={e => setFormData({ ...formData, issuer: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  İptal
                </button>
                <button type="submit" className="btn btn-primary">
                  Evrağı Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
