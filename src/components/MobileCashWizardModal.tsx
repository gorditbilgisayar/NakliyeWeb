// Gördit Bilgisayar — Zafer GÖRGÜN
// DİZA Lojistik & Filo ERP — Mobil Kasa Hızlı Giriş/Çıkış Sihirbazı
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Check, ArrowDownLeft, ArrowUpRight, Wallet, Calendar } from 'lucide-react';
import { formatCurrency } from '../utils/numberToWords';

interface MobileCashWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileCashWizardModal: React.FC<MobileCashWizardModalProps> = ({
  isOpen,
  onClose
}) => {
  const { customers, vehicles, addCashEntry } = useApp();

  const [entryType, setEntryType] = useState<'GELIR' | 'GIDER'>('GELIR');
  const [currency, setCurrency] = useState<'TL' | 'USD' | 'EUR'>('TL');
  const [amount, setAmount] = useState<number>(10000);
  const [category, setCategory] = useState('Müşteri Nakit Tahsilat');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  // Hızlı Tutar Çipleri
  const quickAmounts = [1000, 2500, 5000, 10000, 25000, 50000];

  const quickIncomeCategories = [
    'Müşteri Nakit Tahsilat',
    'Banka Havale / EFT',
    'Navlun Tahsilatı',
    'Ortaklar Kasa Girişi'
  ];

  const quickExpenseCategories = [
    'Şoför Sefer Harcırahı',
    'Mazot & Yakıt Gideri',
    'Araç Bakım & Lastik',
    'Otoban & Köprü Geçişi',
    'Yemek & Yol Masrafı',
    'Ofis & İdari Gider'
  ];

  const handleSave = () => {
    if (!amount || amount <= 0) {
      alert('Lütfen geçerli bir tutar giriniz.');
      return;
    }

    addCashEntry({
      date,
      time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      type: entryType === 'GELIR' ? 'GIRIS' : 'CIKIS',
      category,
      amount: Number(amount),
      currency,
      description: description || `${category} (${entryType === 'GELIR' ? 'Giriş' : 'Çıkış'})`,
      recipientOrSender: entryType === 'GELIR' ? 'Müşteri Tahsilatı' : 'Masraf / Şoför'
    });

    onClose();
  };

  return (
    <div className="mobile-wizard-overlay no-print">
      <div className="mobile-wizard-container">
        {/* Üst Başlık */}
        <div className="mobile-wizard-header">
          <div className="wizard-header-top">
            <div>
              <h3>Hızlı Kasa İşlemi</h3>
              <p>Nakit ve banka hareketini anında kaydet</p>
            </div>
            <button type="button" className="wizard-close-btn" onClick={onClose}>
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Gövde */}
        <div className="mobile-wizard-body">
          {/* 1. GELİR / GİDER BÜYÜK DOKUNMATİK SEÇİCİ */}
          <div className="cash-type-toggle">
            <button
              type="button"
              className={`type-btn income ${entryType === 'GELIR' ? 'active' : ''}`}
              onClick={() => {
                setEntryType('GELIR');
                setCategory(quickIncomeCategories[0]);
              }}
            >
              <ArrowDownLeft size={20} />
              <span>GELİR (TAHSİLAT)</span>
            </button>
            <button
              type="button"
              className={`type-btn expense ${entryType === 'GIDER' ? 'active' : ''}`}
              onClick={() => {
                setEntryType('GIDER');
                setCategory(quickExpenseCategories[0]);
              }}
            >
              <ArrowUpRight size={20} />
              <span>GİDER (ÖDEME)</span>
            </button>
          </div>

          {/* 2. PARA BİRİMİ SEÇİMİ */}
          <div className="wizard-field" style={{ marginTop: 14 }}>
            <label>Para Birimi</label>
            <div className="quick-chips-wrap">
              {(['TL', 'USD', 'EUR'] as const).map(cur => (
                <button
                  key={cur}
                  type="button"
                  className={`quick-chip ${currency === cur ? 'active' : ''}`}
                  onClick={() => setCurrency(cur)}
                >
                  {cur === 'TL' ? '₺ Türk Lirası' : cur === 'USD' ? '$ Amerikan Doları' : '€ Euro'}
                </button>
              ))}
            </div>
          </div>

          {/* 3. BÜYÜK TUTAR GİRİŞİ */}
          <div className="wizard-field">
            <label>İşlem Tutarı ({currency})</label>
            <div className="quick-chips-wrap">
              {quickAmounts.map(amt => (
                <button
                  key={amt}
                  type="button"
                  className={`quick-chip ${amount === amt ? 'active' : ''}`}
                  onClick={() => setAmount(amt)}
                >
                  {amt.toLocaleString('tr-TR')} {currency === 'TL' ? '₺' : currency}
                </button>
              ))}
            </div>
            <input
              type="number"
              className="wizard-input large-number-input"
              style={{ marginTop: 8 }}
              value={amount}
              onChange={e => setAmount(Number(e.target.value))}
              placeholder="0.00"
            />
          </div>

          {/* 4. HIZLI KATEGORİ ÇİPLERİ */}
          <div className="wizard-field">
            <label>İşlem Kategorisi</label>
            <div className="quick-chips-wrap">
              {(entryType === 'GELIR' ? quickIncomeCategories : quickExpenseCategories).map((cat, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`quick-chip ${category === cat ? 'active' : ''}`}
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 5. AÇIKLAMA & TARİH */}
          <div className="wizard-row-2">
            <div className="wizard-field">
              <label>Tarih</label>
              <input
                type="date"
                className="wizard-input"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
            <div className="wizard-field">
              <label>Açıklama (Opsiyonel)</label>
              <input
                type="text"
                className="wizard-input"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Örn: 33 AAB 123 şoför harcırahı"
              />
            </div>
          </div>

          {/* CANLI ÖZET KART */}
          <div className={`wizard-summary-card ${entryType === 'GELIR' ? 'border-success' : 'border-danger'}`}>
            <div className="summary-line">
              <span>İşlem Türü:</span>
              <strong style={{ color: entryType === 'GELIR' ? '#059669' : '#dc2626' }}>
                {entryType === 'GELIR' ? 'KASAYA GİRİŞ (TAHSİLAT)' : 'KASADAN ÇIKIŞ (ÖDEME)'}
              </strong>
            </div>
            <div className="summary-total">
              <span>Toplam Tutar:</span>
              <h3 style={{ color: entryType === 'GELIR' ? '#059669' : '#dc2626' }}>
                {amount.toLocaleString('tr-TR')} {currency === 'TL' ? '₺' : currency}
              </h3>
            </div>
          </div>
        </div>

        {/* Alt Butonlar */}
        <div className="mobile-wizard-footer">
          <button type="button" className="btn btn-secondary wizard-nav-btn" onClick={onClose}>
            İptal
          </button>
          <button
            type="button"
            className={`btn wizard-nav-btn ${entryType === 'GELIR' ? 'btn-success' : 'btn-danger'}`}
            onClick={handleSave}
          >
            <Check size={18} /> {entryType === 'GELIR' ? 'Tahsilatı Kaydet' : 'Ödemeyi Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
};
