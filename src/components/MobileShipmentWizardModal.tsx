// Gördit Bilgisayar — Zafer GÖRGÜN
// DİZA Lojistik & Filo ERP — Mobil Sevkiyat & Yük Sihirbazı (Step-by-Step Wizard)
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  Truck,
  MapPin,
  Package,
  DollarSign,
  Building2,
  Calendar
} from 'lucide-react';
import { formatCurrency } from '../utils/numberToWords';

interface MobileShipmentWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileShipmentWizardModal: React.FC<MobileShipmentWizardModalProps> = ({
  isOpen,
  onClose
}) => {
  const { customers, vehicles, addShipment, cinsiList, defaultVatRate } = useApp();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [formData, setFormData] = useState({
    customerId: customers[0]?.id || 1,
    customerName: customers[0]?.name || '',
    loadingLocation: 'Mersin Limanı',
    unloadingLocation: 'Kayseri OSB',
    senderCompany: customers[0]?.name || '',
    receiverCompany: 'Hedef Alıcı Ltd. Şti.',
    goodsType: 'Profil Sac & Demir',
    packaging: 'Açık Dökme',
    quantity: 27,
    unit: 'Ton',
    unitPrice: 1650,
    currency: 'TL' as const,
    vatRate: defaultVatRate,
    withholdingRate: '5/10',
    orderDate: new Date().toISOString().split('T')[0],
    loadingDate: new Date().toISOString().split('T')[0],
    notes: '',
    selectedVehicleId: vehicles[0]?.id || 0
  });

  if (!isOpen) return null;

  // Hesaplamalar
  const selectedCustomer = customers.find(c => c.id === formData.customerId);
  const subtotal = Number(formData.quantity) * Number(formData.unitPrice);
  const vatAmount = subtotal * (Number(formData.vatRate) / 100);
  const withholdingAmount = formData.withholdingRate === '5/10' ? (vatAmount * 5) / 10 : 0;
  const netPayable = subtotal + vatAmount - withholdingAmount;

  // Hızlı Seçim Çipleri
  const quickLocations = [
    { from: 'Mersin Limanı', to: 'Kayseri OSB' },
    { from: 'İskenderun', to: 'Ankara' },
    { from: 'Mersin', to: 'Gaziantep' },
    { from: 'Adana', to: 'İstanbul' },
    { from: 'Konya', to: 'Mersin Limanı' }
  ];

  const quickGoods = [
    'Profil Sac & Demir',
    'Rulo Sac',
    'İnşaat Demiri',
    'Kuru Bakliyat',
    'Narenciye',
    'Konteyner Yükü',
    'Çimento & Alçı'
  ];

  const quickTonnages = [24, 25, 26, 27, 28, 30];

  const handleCustomerChange = (id: number) => {
    const cust = customers.find(c => c.id === id);
    if (cust) {
      setFormData(prev => ({
        ...prev,
        customerId: cust.id,
        customerName: cust.name,
        senderCompany: cust.name
      }));
    }
  };

  const handleSave = () => {
    const selectedVehicle = vehicles.find(vehicle => vehicle.id === formData.selectedVehicleId);

    addShipment({
      customerId: formData.customerId,
      customerName: formData.customerName,
      loadingLocation: formData.loadingLocation,
      unloadingLocation: formData.unloadingLocation,
      senderCompany: formData.senderCompany,
      receiverCompany: formData.receiverCompany,
      goodsType: formData.goodsType,
      packaging: formData.packaging,
      quantity: Number(formData.quantity),
      unit: formData.unit,
      unitPrice: Number(formData.unitPrice),
      currency: formData.currency,
      vatRate: Number(formData.vatRate),
      withholdingRate: formData.withholdingRate,
      orderDate: formData.orderDate,
      loadingDate: formData.loadingDate,
      status: 'SIPARIS',
      invoiced: false,
      vehicleId: selectedVehicle?.id,
      vehiclePlate: selectedVehicle?.plate,
      driverName: selectedVehicle?.driverName,
      driverPhone: selectedVehicle?.phone,
      notes: formData.notes
    });

    onClose();
    setStep(1);
  };

  return (
    <div className="mobile-wizard-overlay no-print">
      <div className="mobile-wizard-container">
        {/* Üst Başlık & Adım Göstergesi */}
        <div className="mobile-wizard-header">
          <div className="wizard-header-top">
            <div>
              <h3>Yeni Sevkiyat Kaydı</h3>
              <p>Adım {step} / 3: {step === 1 ? 'Müşteri & Güzergah' : step === 2 ? 'Yük & Araç Bilgisi' : 'Tonaj & Navlun Tutarı'}</p>
            </div>
            <button type="button" className="wizard-close-btn" onClick={onClose}>
              <X size={22} />
            </button>
          </div>

          {/* Adım Çizgisi */}
          <div className="wizard-step-progress">
            <div className={`step-bar ${step >= 1 ? 'active' : ''}`} />
            <div className={`step-bar ${step >= 2 ? 'active' : ''}`} />
            <div className={`step-bar ${step >= 3 ? 'active' : ''}`} />
          </div>
        </div>

        {/* Gövde / Adım İçerikleri */}
        <div className="mobile-wizard-body">
          {/* ADIM 1: MÜŞTERİ VE GÜZERGAH */}
          {step === 1 && (
            <div className="wizard-step-content">
              {/* Cari Seçimi */}
              <div className="wizard-field">
                <label><Building2 size={16} /> Müşteri / Cari Firma</label>
                <select
                  className="wizard-select"
                  value={formData.customerId}
                  onChange={e => handleCustomerChange(Number(e.target.value))}
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.city ? `(${c.city})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hızlı Güzergah Çipleri */}
              <div className="wizard-field">
                <label><MapPin size={16} /> Hızlı Sık Kullanılan Güzergahlar</label>
                <div className="quick-chips-wrap">
                  {quickLocations.map((loc, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`quick-chip ${formData.loadingLocation === loc.from && formData.unloadingLocation === loc.to ? 'active' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, loadingLocation: loc.from, unloadingLocation: loc.to }))}
                    >
                      {loc.from} ➔ {loc.to}
                    </button>
                  ))}
                </div>
              </div>

              {/* Çıkış & Varış Yeri */}
              <div className="wizard-row-2">
                <div className="wizard-field">
                  <label>Çıkış (Yükleme)</label>
                  <input
                    type="text"
                    className="wizard-input"
                    value={formData.loadingLocation}
                    onChange={e => setFormData(prev => ({ ...prev, loadingLocation: e.target.value }))}
                    placeholder="Örn: Mersin Limanı"
                  />
                </div>
                <div className="wizard-field">
                  <label>Varış (Boşaltma)</label>
                  <input
                    type="text"
                    className="wizard-input"
                    value={formData.unloadingLocation}
                    onChange={e => setFormData(prev => ({ ...prev, unloadingLocation: e.target.value }))}
                    placeholder="Örn: Kayseri OSB"
                  />
                </div>
              </div>

              {/* Alıcı Firma */}
              <div className="wizard-field">
                <label>Hedef Alıcı Firma</label>
                <input
                  type="text"
                  className="wizard-input"
                  value={formData.receiverCompany}
                  onChange={e => setFormData(prev => ({ ...prev, receiverCompany: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* ADIM 2: YÜK VE ARAÇ BİLGİSİ */}
          {step === 2 && (
            <div className="wizard-step-content">
              {/* Yük Cinsi Çipleri */}
              <div className="wizard-field">
                <label><Package size={16} /> Yük Cinsi</label>
                <div className="quick-chips-wrap">
                  {quickGoods.map((goods, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`quick-chip ${formData.goodsType === goods ? 'active' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, goodsType: goods }))}
                    >
                      {goods}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  className="wizard-input"
                  style={{ marginTop: 8 }}
                  value={formData.goodsType}
                  onChange={e => setFormData(prev => ({ ...prev, goodsType: e.target.value }))}
                  placeholder="Veya elle yük cinsi yazın..."
                />
              </div>

              {/* Araç Plaka Ataması */}
              <div className="wizard-field">
                <label><Truck size={16} /> Atanacak Araç / Plaka (Opsiyonel)</label>
                <select
                  className="wizard-select"
                  value={formData.selectedVehicleId}
                  onChange={e => setFormData(prev => ({ ...prev, selectedVehicleId: Number(e.target.value) }))}
                >
                  <option value={0}>-- Araç Sonra Atansın (Sipariş Modu) --</option>
                  {vehicles.filter(v => v.isActive).map(v => (
                    <option key={v.id} value={v.id}>
                      {v.plate} - {v.driverName} ({v.trailerPlate || 'Dorse Yok'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Yükleme Tarihi */}
              <div className="wizard-field">
                <label><Calendar size={16} /> Yükleme Tarihi</label>
                <input
                  type="date"
                  className="wizard-input"
                  value={formData.loadingDate}
                  onChange={e => setFormData(prev => ({ ...prev, loadingDate: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* ADIM 3: TONAJ, BİRİM FİYAT VE NAVLUN */}
          {step === 3 && (
            <div className="wizard-step-content">
              {/* Hızlı Tonaj Çipleri */}
              <div className="wizard-field">
                <label><Package size={16} /> Miktar / Tonaj (Ton)</label>
                <div className="quick-chips-wrap">
                  {quickTonnages.map(t => (
                    <button
                      key={t}
                      type="button"
                      className={`quick-chip ${Number(formData.quantity) === t ? 'active' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, quantity: t }))}
                    >
                      {t} Ton
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  step="0.1"
                  className="wizard-input large-number-input"
                  style={{ marginTop: 8 }}
                  value={formData.quantity}
                  onChange={e => setFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                />
              </div>

              {/* Birim Fiyat */}
              <div className="wizard-field">
                <label><DollarSign size={16} /> Ton Başı Navlun Birim Fiyatı (₺)</label>
                <input
                  type="number"
                  className="wizard-input large-number-input"
                  value={formData.unitPrice}
                  onChange={e => setFormData(prev => ({ ...prev, unitPrice: Number(e.target.value) }))}
                  placeholder="Örn: 1650"
                />
              </div>

              {/* Tevkifat & KDV Çipleri */}
              <div className="wizard-field">
                <label>Tevkifat & KDV Oranı</label>
                <div className="quick-chips-wrap">
                  <button
                    type="button"
                    className={`quick-chip ${formData.withholdingRate === '5/10' ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, withholdingRate: '5/10', vatRate: 20 }))}
                  >
                    Tevkifatlı (5/10 - KDV %20)
                  </button>
                  <button
                    type="button"
                    className={`quick-chip ${formData.withholdingRate === 'YOK' ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, withholdingRate: 'YOK', vatRate: 20 }))}
                  >
                    Tevkifatsız (Standart %20)
                  </button>
                  <button
                    type="button"
                    className={`quick-chip ${formData.vatRate === 0 ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, withholdingRate: 'YOK', vatRate: 0 }))}
                  >
                    KDV Hariç / İstisna (%0)
                  </button>
                </div>
              </div>

              {/* CANLI HESAPLAMA KARTI */}
              <div className="wizard-summary-card">
                {selectedCustomer && (
                  <div className="summary-line">
                    <span>Cari Şehir & İletişim:</span>
                    <strong>{selectedCustomer.city} • {selectedCustomer.phone}</strong>
                  </div>
                )}
                <div className="summary-line">
                  <span>Ara Toplam (Navlun):</span>
                  <strong>{subtotal.toLocaleString('tr-TR')} ₺</strong>
                </div>
                <div className="summary-line">
                  <span>KDV (%{formData.vatRate}):</span>
                  <span>+{vatAmount.toLocaleString('tr-TR')} ₺</span>
                </div>
                {formData.withholdingRate === '5/10' && (
                  <div className="summary-line text-warning">
                    <span>5/10 Tevkifat Kesintisi:</span>
                    <span>-{withholdingAmount.toLocaleString('tr-TR')} ₺</span>
                  </div>
                )}
                <div className="summary-total">
                  <span>Tahsil Edilecek Net Tutar:</span>
                  <h3>{formatCurrency(netPayable, 'TL')}</h3>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Alt Butonlar Barı */}
        <div className="mobile-wizard-footer">
          {step > 1 ? (
            <button
              type="button"
              className="btn btn-secondary wizard-nav-btn"
              onClick={() => setStep((step - 1) as 1 | 2)}
            >
              <ChevronLeft size={18} /> Geri
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-secondary wizard-nav-btn"
              onClick={onClose}
            >
              İptal
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              className="btn btn-primary wizard-nav-btn"
              onClick={() => setStep((step + 1) as 2 | 3)}
            >
              İleri <ChevronRight size={18} />
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-success wizard-nav-btn save-btn"
              onClick={handleSave}
            >
              <Check size={18} /> Sevkiyatı Kaydet
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
