// Gördit Bilgisayar — Zafer GÖRGÜN
// DİZA Lojistik & Filo ERP — Mobil Hızlı Eylem Butonu (FAB)
import React, { useState } from 'react';
import { Plus, X, Package, Wallet, FileText, Clock } from 'lucide-react';

interface MobileQuickActionFabProps {
  onNewShipment: () => void;
  onNewCash: () => void;
  onNewInvoice: () => void;
  onNewReminder?: () => void;
}

export const MobileQuickActionFab: React.FC<MobileQuickActionFabProps> = ({
  onNewShipment,
  onNewCash,
  onNewInvoice,
  onNewReminder
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (actionFn: () => void) => {
    setIsOpen(false);
    actionFn();
  };

  return (
    <>
      {/* Arka plan karartma overlay */}
      {isOpen && (
        <div
          className="fab-backdrop no-print"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* FAB Konteyner */}
      <div className="mobile-fab-container no-print">
        {/* Açılır Menü Seçenekleri */}
        {isOpen && (
          <div className="fab-menu-options">
            <button
              type="button"
              className="fab-option-btn option-shipment"
              onClick={() => handleAction(onNewShipment)}
            >
              <span className="fab-option-label">Yeni Sevkiyat & Yük</span>
              <div className="fab-option-icon">
                <Package size={20} />
              </div>
            </button>

            <button
              type="button"
              className="fab-option-btn option-cash"
              onClick={() => handleAction(onNewCash)}
            >
              <span className="fab-option-label">Kasa Giriş / Çıkış</span>
              <div className="fab-option-icon">
                <Wallet size={20} />
              </div>
            </button>

            <button
              type="button"
              className="fab-option-btn option-invoice"
              onClick={() => handleAction(onNewInvoice)}
            >
              <span className="fab-option-label">Hızlı Fatura & Tevkifat</span>
              <div className="fab-option-icon">
                <FileText size={20} />
              </div>
            </button>

            {onNewReminder && (
              <button
                type="button"
                className="fab-option-btn option-reminder"
                onClick={() => handleAction(onNewReminder)}
              >
                <span className="fab-option-label">Vade / Çek Ekle</span>
                <div className="fab-option-icon">
                  <Clock size={20} />
                </div>
              </button>
            )}
          </div>
        )}

        {/* Ana Yuvarlak Tetikleyici Buton */}
        <button
          type="button"
          className={`mobile-fab-main-btn ${isOpen ? 'active' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Hızlı İşlem Menüsü"
        >
          {isOpen ? <X size={26} /> : <Plus size={28} />}
        </button>
      </div>
    </>
  );
};
