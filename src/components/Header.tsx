import React from 'react';
import { useApp } from '../context/AppContext';
import { Bell, Wallet, Menu } from 'lucide-react';
import { formatCurrency } from '../utils/numberToWords';

export const Header: React.FC<{
  onOpenReminders: () => void;
  onToggleMobileMenu?: () => void;
}> = ({ onOpenReminders, onToggleMobileMenu }) => {
  const { activeTab, exchangeRates, reminders, getCashBalance } = useApp();

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return { title: 'Genel Bakış & Yönetim', subtitle: 'Finansal özet, seferler ve anlık kasa' };
      case 'vehicle_registration': return { title: 'Araç & Sürücü Kayıt', subtitle: 'Ruhsat, dorse, ehliyet ve hesap tanımları' };
      case 'shipments': return { title: 'Sevkiyat & Fatura Aktarımı', subtitle: 'Açık sevkiyatlar ve faturalandırma' };
      case 'vehicles': return { title: 'Cari Hareketler & Ekstre', subtitle: 'Araç, şoför ve müşteri hesap hareketleri' };
      case 'customers': return { title: 'Firmalar & Cari Hesaplar', subtitle: 'Firma kartları, yetkililer ve ekstreler' };
      case 'invoices': return { title: 'Fatura & Tevkifat', subtitle: 'Tevkifatlı fatura kesimi ve dökümler' };
      case 'cashbook': return { title: 'Kasa & Nakit Akışı', subtitle: 'Günlük devir ve çoklu dövizli kasa' };
      case 'reminders': return { title: 'Vade & Risk Takibi', subtitle: 'Vadeli alacaklar ve çek/senetler' };
      case 'envelopes': return { title: 'Zarf Yazdırma', subtitle: 'Resmi posta zarf şablonları' };
      case 'parameters': return { title: 'Sistem Parametreleri', subtitle: 'Yük tipleri, tanımlar ve standartlar' };
      default: return { title: 'DİZA Lojistik', subtitle: 'Gördit Bilgisayar' };
    }
  };

  const { title, subtitle } = getTitle();
  const pendingReminders = reminders.filter(r => r.status === 'BEKLIYOR');
  const cashTL = getCashBalance('TL');

  return (
    <header className="top-header no-print">
      <div className="header-main-row">
        <div className="header-left">
          {onToggleMobileMenu && (
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={onToggleMobileMenu}
              aria-label="Menüyü Aç"
            >
              <Menu size={22} />
            </button>
          )}
          <div className="header-title">
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
        </div>

        <div className="header-actions">
          {/* Vade Uyarı Butonu */}
          <button
            className="btn btn-secondary btn-sm header-bell-btn"
            onClick={onOpenReminders}
            style={{ position: 'relative' }}
            title="Yaklaşan Vadeler"
          >
            <Bell size={18} color={pendingReminders.length > 0 ? '#fbbf24' : '#9ca3af'} />
            {pendingReminders.length > 0 && (
              <span className="bell-badge">
                {pendingReminders.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="header-rates-bar">
        {/* Canlı TL Kasası */}
        <div className="rate-badge cash-badge" title="Canlı TL Kasası">
          <Wallet size={14} color="var(--diza-red)" />
          <span className="badge-label">Kasa:</span>
          <strong style={{ color: cashTL >= 0 ? '#10b981' : '#ef4444' }}>
            {formatCurrency(cashTL, 'TL')}
          </strong>
        </div>

        {/* Canlı Kurlar */}
        {exchangeRates.filter(r => r.currency !== 'TL').map(r => (
          <div key={r.currency} className="rate-badge">
            <span className="code">{r.currency}:</span>
            <span>{r.sellRate.toFixed(2)} ₺</span>
          </div>
        ))}
      </div>
    </header>
  );
};
