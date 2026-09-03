import React from 'react';
import { useApp } from '../context/AppContext';
import { X, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/numberToWords';

export const NotificationModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { reminders, updateReminderStatus, customers } = useApp();

  if (!isOpen) return null;

  const pendingReminders = reminders.filter(r => r.status === 'BEKLIYOR');
  const problematicCustomers = customers.filter(c => c.isProblematic);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle color="var(--diza-red)" size={22} />
            <h3>Vade & Risk Bildirim Panosu</h3>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* Riskli Firmalar Uyarısı */}
          {problematicCustomers.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: 13, color: '#ef4444', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={15} /> DİKKAT: Riskli / Problemli Müşteriler
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {problematicCustomers.map(c => (
                  <div
                    key={c.id}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: 'var(--radius-md)',
                      padding: 12,
                      fontSize: 13
                    }}
                  >
                    <strong style={{ color: '#fca5a5' }}>{c.name}</strong>
                    <p style={{ color: '#d1d5db', marginTop: 4, fontSize: 12 }}>
                      {c.problemReason || 'Ödeme sorunları veya karşılıksız evrak kaydı var.'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bekleyen Vadeli Çek / Senetler */}
          <div>
            <h4 style={{ fontSize: 13, color: '#fbbf24', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={15} /> Yaklaşan Vadeler & Çek / Senetler ({pendingReminders.length})
            </h4>

            {pendingReminders.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Şu an bekleyen veya vadesi yaklaşan evrak bulunmuyor.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pendingReminders.map(r => (
                  <div
                    key={r.id}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: 14,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={`badge-status ${r.direction === 'ALACAK' ? 'badge-teslim' : 'badge-fatura'}`}>
                          {r.direction === 'ALACAK' ? 'Alınan Çek/Senet' : 'Verilen Çek/Senet'}
                        </span>
                        <strong style={{ fontSize: 14 }}>{r.issuer}</strong>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                        Vade: <strong>{formatDate(r.dueDate)}</strong> | {r.bankName || 'Banka Yok'} ({r.checkNo || 'No Yok'})
                      </p>
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      <strong style={{ color: '#fff', fontSize: 15, fontFamily: 'var(--font-mono)' }}>
                        {formatCurrency(r.amount, r.currency)}
                      </strong>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => updateReminderStatus(r.id, 'TAHSIL_EDILDI')}
                        style={{ fontSize: 11, padding: '4px 8px' }}
                      >
                        <CheckCircle size={12} /> Tahsil Edildi
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Anladım, Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
