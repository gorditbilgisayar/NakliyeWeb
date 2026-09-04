import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Shipment, CurrencyType, ShipmentStatus } from '../types';
import {
  Package,
  Plus,
  Search,
  Truck,
  CheckCircle,
  FileText,
  Filter,
  ArrowRight,
  X,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckSquare,
  Square,
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/numberToWords';

export const ShipmentsView: React.FC<{
  isOpenNewModal: boolean;
  onCloseNewModal: () => void;
  onOpenNewModal: () => void;
}> = ({ isOpenNewModal, onCloseNewModal, onOpenNewModal }) => {
  const {
    shipments,
    customers,
    vehicles,
    invoices,
    addShipment,
    assignVehicleToShipment,
    completeShipment,
    deleteShipment,
    createInvoiceFromShipments,
    setActiveTab,
    vatRates,
    defaultVatRate
  } = useApp();

  // Filtre Sekmesi: UNINVOICED (Varsayılan - Faturalandırılmamış), INVOICED (Faturalandırılmış), ALL (Tümü)
  const [invoiceFilterTab, setInvoiceFilterTab] = useState<'UNINVOICED' | 'INVOICED' | 'ALL'>('UNINVOICED');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Çoklu Seçim Listesi (Seçilen Sevkiyat ID'leri)
  const [selectedShipmentIds, setSelectedShipmentIds] = useState<number[]>([]);

  // Araç Atama Modal State
  const [assignModalShipment, setAssignModalShipment] = useState<Shipment | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number>(vehicles[0]?.id || 1);
  const [driverFreightCost, setDriverFreightCost] = useState<number>(0);

  // Yeni Sevkiyat Form State
  const [formData, setFormData] = useState({
    customerId: customers[0]?.id || 101,
    loadingLocation: '',
    unloadingLocation: '',
    senderCompany: '',
    receiverCompany: '',
    goodsType: '',
    packaging: 'Paletli',
    quantity: 25,
    unit: 'Ton',
    unitPrice: 1500,
    currency: 'TL' as CurrencyType,
    vatRate: defaultVatRate,
    withholdingRate: '5/10',
    loadingDate: new Date().toISOString().split('T')[0],
    orderDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Filtrelenmiş Sevkiyatlar
  const filteredShipments = useMemo(() => {
    return shipments.filter(s => {
      // Fatura Durumu Filtresi
      let matchesInvoiceTab = true;
      if (invoiceFilterTab === 'UNINVOICED') {
        matchesInvoiceTab = !s.invoiced;
      } else if (invoiceFilterTab === 'INVOICED') {
        matchesInvoiceTab = !!s.invoiced;
      }

      // Arama Filtresi
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm.trim() ||
        s.shipmentNo.toLowerCase().includes(q) ||
        s.customerName.toLowerCase().includes(q) ||
        s.loadingLocation.toLowerCase().includes(q) ||
        s.unloadingLocation.toLowerCase().includes(q) ||
        s.goodsType.toLowerCase().includes(q) ||
        (s.vehiclePlate && s.vehiclePlate.toLowerCase().includes(q));

      return matchesInvoiceTab && matchesSearch;
    });
  }, [shipments, invoiceFilterTab, searchTerm]);

  // Sayılar
  const unInvoicedCount = useMemo(() => shipments.filter(s => !s.invoiced).length, [shipments]);
  const invoicedCount = useMemo(() => shipments.filter(s => s.invoiced).length, [shipments]);

  // Seçili Sevkiyatların Toplamı
  const selectedShipmentsData = useMemo(() => {
    const selected = shipments.filter(s => selectedShipmentIds.includes(s.id));
    const totalAmount = selected.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
    const totalTons = selected.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
    return { selected, totalAmount, totalTons };
  }, [shipments, selectedShipmentIds]);

  // Tümünü Seç / Kaldır
  const handleSelectAll = () => {
    if (selectedShipmentIds.length === filteredShipments.length && filteredShipments.length > 0) {
      setSelectedShipmentIds([]);
    } else {
      setSelectedShipmentIds(filteredShipments.map(s => s.id));
    }
  };

  // Tekil Satır Seçimi
  const handleToggleSelect = (id: number) => {
    setSelectedShipmentIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // FATURAYA DÖNÜŞTÜR FONKSİYONU
  const handleConvertSelectedToInvoice = (targetIds?: number[]) => {
    const idsToConvert = targetIds || selectedShipmentIds;

    if (idsToConvert.length === 0) {
      alert('Lütfen faturaya dönüştürmek için en az 1 adet sevkiyat seçiniz.');
      return;
    }

    // 1. Mükerrer Fatura Kontrolü
    const alreadyInvoiced = shipments.filter(s => idsToConvert.includes(s.id) && s.invoiced);
    if (alreadyInvoiced.length > 0) {
      const invNos = alreadyInvoiced.map(s => {
        const inv = invoices.find(i => i.id === s.invoiceId);
        return `${s.shipmentNo} (Fatura: ${inv?.invoiceNo || s.invoiceId || 'Mevcut'})`;
      }).join(', ');

      alert(`UYARI: Seçilen sevkiyatlar arasında daha önce faturalandırılmış kayıtlar bulunmaktadır!\n\n${invNos}\n\nMükerrer fatura kesilemez. Lütfen sadece faturası kesilmemiş olanları seçiniz.`);
      return;
    }

    const selectedList = shipments.filter(s => idsToConvert.includes(s.id));
    const firstShipment = selectedList[0];
    if (!firstShipment) return;

    // Farklı müşteri uyarısı kontrolü
    const uniqueCustomerIds = Array.from(new Set(selectedList.map(s => s.customerId)));
    if (uniqueCustomerIds.length > 1) {
      const confirmMultiple = window.confirm(
        'DİKKAT: Seçtiğiniz sevkiyatlar farklı carilere / müşterilere aittir.\nTüm kalemler ilk seçilen cari adına tek bir faturada birleştirilecektir. Devam etmek istiyor musunuz?'
      );
      if (!confirmMultiple) return;
    }

    // Otomatik Resmi Fatura Numarası ve Tarihi
    const invoiceNo = `TUR${new Date().getFullYear()}${String(Math.floor(Math.random() * 900000) + 100000)}`;
    const invoiceDate = new Date().toISOString().split('T')[0];

    // Faturayı Oluştur
    let newInvoice;
    try {
      newInvoice = createInvoiceFromShipments(
        firstShipment.customerId,
        idsToConvert,
        invoiceNo,
        invoiceDate,
        `Sevkiyat Listesinden Toplu Fatura Aktarımı (${idsToConvert.length} Sefer Kalemi)`
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Fatura oluşturulamadı.');
      return;
    }

    // Seçimi Temizle
    setSelectedShipmentIds([]);

    // Kullanıcıya Bilgi Ver ve Faturalar Sekmesine Yönlendir
    alert(`BAŞARILI: ${idsToConvert.length} adet sevkiyat başarıyla faturalandırıldı!\n\nOluşturulan Fatura No: ${invoiceNo}\nGenel Toplam: ${newInvoice.grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${newInvoice.currency}\n\nŞimdi Faturalar & Tevkifat modülüne aktarılıyorsunuz.`);
    setActiveTab('invoices');
  };

  // Yeni Sevkiyat Kaydetme
  const handleCreateShipment = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find(c => c.id === Number(formData.customerId));
    if (!cust) return;

    if (cust.isProblematic) {
      const confirmRisk = window.confirm(
        `UYARI: ${cust.name} riskli müşteriler listesindedir!\nSebep: ${cust.problemReason}\nYine de devam etmek istiyor musunuz?`
      );
      if (!confirmRisk) return;
    }

    addShipment({
      customerId: cust.id,
      customerName: cust.name,
      loadingLocation: formData.loadingLocation || 'Mersin Limanı',
      unloadingLocation: formData.unloadingLocation || 'Kayseri OSB',
      senderCompany: formData.senderCompany || cust.name,
      receiverCompany: formData.receiverCompany || 'Alıcı Firma',
      goodsType: formData.goodsType || 'Profil Sac & Demir',
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
      notes: formData.notes
    });

    onCloseNewModal();
  };

  // Araç Atama
  const handleAssignVehicle = () => {
    if (!assignModalShipment) return;
    assignVehicleToShipment(assignModalShipment.id, selectedVehicleId, Number(driverFreightCost));
    setAssignModalShipment(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 1. ÜST KONTROL & SEÇİM PANELİ (DİZA Glass Card) */}
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
        {/* Sol: Başlık & Sekmeler */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', margin: 0 }}>
                Sevkiyat Listesi & Fatura Aktarımı
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
                {unInvoicedCount} Fatura Bekleyen
              </span>
            </div>
            <p style={{ fontSize: 11.5, color: '#64748b', margin: '2px 0 0 0' }}>
              Faturalandırılmamış sevkiyatları seçip tek tıkla resmi faturaya dönüştürün
            </p>
          </div>

          {/* Sekme Butonları */}
          <div className="scrollable-tabs-bar" style={{ display: 'flex', background: '#f1f5f9', padding: 3, borderRadius: 6, gap: 2 }}>
            <button
              type="button"
              onClick={() => setInvoiceFilterTab('UNINVOICED')}
              style={{
                background: invoiceFilterTab === 'UNINVOICED' ? 'var(--diza-red)' : 'transparent',
                color: invoiceFilterTab === 'UNINVOICED' ? '#ffffff' : '#475569',
                border: 'none',
                padding: '5px 12px',
                borderRadius: 4,
                fontSize: 11.5,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <AlertTriangle size={13} />
              Faturalandırılmamış ({unInvoicedCount})
            </button>

            <button
              type="button"
              onClick={() => setInvoiceFilterTab('INVOICED')}
              style={{
                background: invoiceFilterTab === 'INVOICED' ? '#10b981' : 'transparent',
                color: invoiceFilterTab === 'INVOICED' ? '#ffffff' : '#475569',
                border: 'none',
                padding: '5px 12px',
                borderRadius: 4,
                fontSize: 11.5,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <CheckCircle size={13} />
              Faturalandırılmış ({invoicedCount})
            </button>

            <button
              type="button"
              onClick={() => setInvoiceFilterTab('ALL')}
              style={{
                background: invoiceFilterTab === 'ALL' ? '#0f172a' : 'transparent',
                color: invoiceFilterTab === 'ALL' ? '#ffffff' : '#475569',
                border: 'none',
                padding: '5px 12px',
                borderRadius: 4,
                fontSize: 11.5,
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Tümü ({shipments.length})
            </button>
          </div>
        </div>

        {/* Sağ: Arama Kutusu & Yeni Yük Butonu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Sefer No, Plaka, Müşteri Bul..."
              style={{
                width: 220,
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
            <Plus size={15} /> Yeni Sevkiyat Ekle
          </button>
        </div>
      </div>

      {/* 2. CANLI SEÇİM & FATURAYA DÖNÜŞTÜRME EYLEM BANDI */}
      {selectedShipmentIds.length > 0 && (
        <div
          className="glass-card"
          style={{
            padding: '12px 18px',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            borderRadius: 8,
            boxShadow: '0 4px 14px rgba(15,23,42,0.2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ background: 'var(--diza-red)', color: '#fff', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 900 }}>
              {selectedShipmentIds.length} Sevkiyat Seçildi
            </div>
            <div style={{ fontSize: 12, color: '#cbd5e1' }}>
              Toplam Tonaj: <strong style={{ color: '#fff' }}>{selectedShipmentsData.totalTons.toLocaleString('tr-TR')} Ton</strong> • Toplam Navlun: <strong style={{ color: '#4ade80', fontFamily: 'monospace', fontSize: 13 }}>{selectedShipmentsData.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => setSelectedShipmentIds([])}
              style={{
                background: 'rgba(255,255,255,0.1)',
                color: '#cbd5e1',
                border: 'none',
                padding: '6px 12px',
                borderRadius: 5,
                fontSize: 11.5,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Seçimi Temizle
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleConvertSelectedToInvoice()}
              style={{
                padding: '7px 18px',
                fontSize: 12.5,
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 4px 12px rgba(225,29,72,0.4)'
              }}
            >
              <FileText size={15} /> Seçilenleri Faturaya Dönüştür ({selectedShipmentIds.length})
            </button>
          </div>
        </div>
      )}

      {/* 3. ANA SEVKİYAT LİSTESİ TABLOSU */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden', borderRadius: 8 }}>
        {/* Masaüstü Tablosu */}
        <div className="desktop-only-table" style={{ overflowX: 'auto', maxHeight: 580 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
            <thead>
              <tr
                style={{
                  background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                  color: '#ffffff',
                  fontWeight: 800
                }}
              >
                <th style={{ width: 40, padding: '9px 6px', textAlign: 'center', borderRight: '1px solid #334155' }}>
                  <input
                    type="checkbox"
                    checked={selectedShipmentIds.length === filteredShipments.length && filteredShipments.length > 0}
                    onChange={handleSelectAll}
                    style={{ cursor: 'pointer', width: 15, height: 15 }}
                    title="Tümünü Seç / Kaldır"
                  />
                </th>
                <th style={{ width: 90, padding: '9px 8px', textAlign: 'left', borderRight: '1px solid #334155' }}>Sefer No</th>
                <th style={{ width: 85, padding: '9px 8px', textAlign: 'center', borderRight: '1px solid #334155' }}>Tarih</th>
                <th style={{ padding: '9px 10px', textAlign: 'left', borderRight: '1px solid #334155' }}>Müşteri / Cari</th>
                <th style={{ padding: '9px 10px', textAlign: 'left', borderRight: '1px solid #334155' }}>Güzergah</th>
                <th style={{ padding: '9px 10px', textAlign: 'left', borderRight: '1px solid #334155' }}>Yük Cinsi & Miktar</th>
                <th style={{ padding: '9px 8px', textAlign: 'left', borderRight: '1px solid #334155' }}>Araç / Sürücü</th>
                <th style={{ width: 100, padding: '9px 8px', textAlign: 'right', borderRight: '1px solid #334155' }}>Navlun</th>
                <th style={{ width: 130, padding: '9px 8px', textAlign: 'center', borderRight: '1px solid #334155' }}>Fatura Durumu</th>
                <th style={{ width: 120, padding: '9px 8px', textAlign: 'center' }}>İşlem</th>
              </tr>
            </thead>

            <tbody>
              {filteredShipments.map((s, idx) => {
                const isSelected = selectedShipmentIds.includes(s.id);
                const linkedInvoice = s.invoiceId ? invoices.find(i => i.id === s.invoiceId) : null;

                return (
                  <tr
                    key={s.id}
                    style={{
                      background: isSelected ? '#fef2f2' : idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                      borderBottom: '1px solid #e2e8f0',
                      transition: 'background 0.15s'
                    }}
                  >
                    {/* Çoklu Seçim Checkbox */}
                    <td style={{ padding: '6px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(s.id)}
                        style={{ cursor: 'pointer', width: 15, height: 15 }}
                      />
                    </td>

                    {/* Sefer No */}
                    <td style={{ padding: '6px 8px', fontWeight: 900, color: 'var(--diza-red)', fontFamily: 'monospace', borderRight: '1px solid #e2e8f0' }}>
                      {s.shipmentNo}
                    </td>

                    {/* Tarih */}
                    <td style={{ padding: '6px 8px', textAlign: 'center', color: '#64748b', fontSize: 11, borderRight: '1px solid #e2e8f0' }}>
                      {s.loadingDate || s.orderDate}
                    </td>

                    {/* Müşteri / Cari */}
                    <td style={{ padding: '6px 10px', fontWeight: 700, color: '#0f172a', borderRight: '1px solid #e2e8f0' }}>
                      {s.customerName}
                    </td>

                    {/* Güzergah */}
                    <td style={{ padding: '6px 10px', fontSize: 11.5, borderRight: '1px solid #e2e8f0' }}>
                      <span style={{ color: '#047857', fontWeight: 700 }}>{s.loadingLocation}</span> → <span style={{ color: '#b91c1c', fontWeight: 700 }}>{s.unloadingLocation}</span>
                    </td>

                    {/* Yük Cinsi & Miktar */}
                    <td style={{ padding: '6px 10px', borderRight: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: 700, color: '#334155' }}>{s.goodsType}</div>
                      <div style={{ fontSize: 10.5, color: '#64748b' }}>
                        {s.quantity} {s.unit || 'Ton'} • {s.unitPrice?.toLocaleString('tr-TR')} ₺/Birim
                      </div>
                    </td>

                    {/* Araç & Şoför */}
                    <td style={{ padding: '6px 8px', borderRight: '1px solid #e2e8f0' }}>
                      {s.vehiclePlate ? (
                        <div>
                          <span style={{ background: '#f1f5f9', padding: '2px 5px', borderRadius: 4, fontWeight: 900, color: '#0f172a', fontSize: 11 }}>
                            {s.vehiclePlate}
                          </span>
                          <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{s.driverName || 'Sürücü'}</div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setAssignModalShipment(s)}
                          style={{
                            background: '#fffbeb',
                            color: '#b45309',
                            border: '1px dashed #f59e0b',
                            padding: '3px 7px',
                            borderRadius: 4,
                            fontSize: 10.5,
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          + Araç Ata
                        </button>
                      )}
                    </td>

                    {/* Navlun Tutarı */}
                    <td
                      style={{
                        padding: '6px 8px',
                        textAlign: 'right',
                        fontWeight: 900,
                        fontFamily: 'monospace',
                        color: '#0f172a',
                        borderRight: '1px solid #e2e8f0'
                      }}
                    >
                      {s.totalAmount?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {s.currency}
                    </td>

                    {/* Fatura Durumu */}
                    <td style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>
                      {s.invoiced ? (
                        <span
                          style={{
                            background: 'rgba(16,185,129,0.12)',
                            color: '#059669',
                            padding: '3px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <CheckCircle size={12} /> Faturalandı
                        </span>
                      ) : (
                        <span
                          style={{
                            background: 'rgba(239,68,68,0.1)',
                            color: '#dc2626',
                            padding: '3px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 800
                          }}
                        >
                          Açık (Faturasız)
                        </span>
                      )}
                    </td>

                    {/* İşlem */}
                    <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                      {s.invoiced ? (
                        <button
                          type="button"
                          onClick={() => alert(`DİKKAT: Bu sevkiyat daha önce faturalandırılmıştır!\n\nFatura No: ${linkedInvoice?.invoiceNo || 'Mevcut'}\nFatura Tarihi: ${linkedInvoice?.invoiceDate || '-'}\nGenel Toplam: ${linkedInvoice?.grandTotal?.toLocaleString('tr-TR')} ${linkedInvoice?.currency || 'TL'}`)}
                          style={{
                            background: '#f1f5f9',
                            color: '#64748b',
                            border: '1px solid #cbd5e1',
                            borderRadius: 4,
                            padding: '3px 8px',
                            fontSize: 10.5,
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                          title="Faturalandırılmış Kayıt Bilgisi"
                        >
                          Faturası Var
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleConvertSelectedToInvoice([s.id])}
                          className="btn btn-primary"
                          style={{
                            padding: '3px 9px',
                            fontSize: 10.5,
                            borderRadius: 4,
                            fontWeight: 800
                          }}
                          title="Bu Sevkiyata Fatura Kes"
                        >
                          Fatura Kes
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredShipments.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ padding: 35, textAlign: 'center', color: '#94a3b8' }}>
                    {invoiceFilterTab === 'UNINVOICED'
                      ? 'Harika! Faturalandırılmayı bekleyen açık sevkiyat bulunmuyor.'
                      : 'Kriterlere uygun sevkiyat kaydı bulunamadı.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobilde Dokunmatik Sevkiyat Kartları */}
        <div className="mobile-only-cards" style={{ padding: '8px' }}>
          {filteredShipments.map(s => {
            const isSelected = selectedShipmentIds.includes(s.id);
            return (
              <div
                key={s.id}
                className={`mobile-action-card ${isSelected ? 'selected' : ''}`}
                style={{
                  borderLeft: isSelected ? '4px solid var(--diza-red)' : s.invoiced ? '4px solid #10b981' : '4px solid #f59e0b'
                }}
              >
                <div className="card-top-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(s.id)}
                      style={{ width: 18, height: 18, cursor: 'pointer' }}
                    />
                    <span style={{ fontWeight: 900, color: 'var(--diza-red)', fontFamily: 'monospace', fontSize: 13 }}>
                      {s.shipmentNo}
                    </span>
                  </div>
                  <span className={`card-status-badge ${s.invoiced ? 'invoiced' : 'open'}`}>
                    {s.invoiced ? 'FATURALANDI' : 'AÇIK (FATURASIZ)'}
                  </span>
                </div>

                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a', margin: '4px 0 2px 0' }}>
                  {s.customerName}
                </div>

                <div className="card-route-row">
                  <span className="from-loc">{s.loadingLocation}</span>
                  <span className="route-arrow">➔</span>
                  <span className="to-loc">{s.unloadingLocation}</span>
                </div>

                <div className="card-meta-row">
                  <span>{s.goodsType} ({s.quantity} {s.unit || 'Ton'}) • {s.vehiclePlate || 'Araç Atanmamış'}</span>
                </div>

                <div className="card-bottom-row">
                  <div className="card-amount">
                    <span className="label">Navlun:</span>
                    <strong>{s.totalAmount?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {s.currency}</strong>
                  </div>
                  <div>
                    {!s.invoiced ? (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => handleConvertSelectedToInvoice([s.id])}
                      >
                        Fatura Kes
                      </button>
                    ) : (
                      <span style={{ fontSize: 11, color: '#059669', fontWeight: 800 }}>✓ Faturalı</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredShipments.length === 0 && (
            <div className="mobile-empty-card">
              Kriterlere uygun sevkiyat kaydı bulunamadı.
            </div>
          )}
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
            Listelenen: <strong>{filteredShipments.length}</strong> Sevkiyat • Toplam Faturalandırılmamış: <strong style={{ color: '#dc2626' }}>{unInvoicedCount}</strong>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <div>
              <span style={{ color: '#64748b', marginRight: 6 }}>Toplam Tonaj:</span>
              <strong style={{ color: '#0f172a', fontFamily: 'monospace', fontSize: 13 }}>
                {filteredShipments.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0).toLocaleString('tr-TR')} Ton
              </strong>
            </div>

            <div>
              <span style={{ color: '#64748b', marginRight: 6 }}>Toplam Tutar:</span>
              <strong style={{ color: 'var(--diza-red)', fontFamily: 'monospace', fontSize: 14, fontWeight: 900 }}>
                {filteredShipments.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* 4. YENİ SEVKİYAT OLUŞTURMA MODALI */}
      {isOpenNewModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
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
              width: 720,
              maxWidth: '95vw',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
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
              <h3 style={{ fontSize: 15, fontWeight: 900, margin: 0 }}>Yeni Sevkiyat & Yük Kaydı</h3>
              <button
                type="button"
                onClick={onCloseNewModal}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#ffffff', cursor: 'pointer', borderRadius: 4, padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateShipment} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                    Müşteri / Cari Seçimi *
                  </label>
                  <select
                    value={formData.customerId}
                    onChange={e => setFormData(prev => ({ ...prev, customerId: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12, fontWeight: 700 }}
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
                    Yük Cinsi *
                  </label>
                  <input
                    type="text"
                    value={formData.goodsType}
                    onChange={e => setFormData(prev => ({ ...prev, goodsType: e.target.value }))}
                    placeholder="Örn: Profil Sac, Demir, Çimento, Gıda"
                    required
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                    Yükleme Yeri (Çıkış) *
                  </label>
                  <input
                    type="text"
                    value={formData.loadingLocation}
                    onChange={e => setFormData(prev => ({ ...prev, loadingLocation: e.target.value }))}
                    placeholder="Örn: Mersin Limanı / ETİ BAKIR"
                    required
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                    İndirme Yeri (Varış) *
                  </label>
                  <input
                    type="text"
                    value={formData.unloadingLocation}
                    onChange={e => setFormData(prev => ({ ...prev, unloadingLocation: e.target.value }))}
                    placeholder="Örn: Kayseri OSB / Mardin Tesis"
                    required
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                    Miktar / Tonaj *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={e => setFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                    required
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12, fontWeight: 800 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                    Birim Fiyat (Navlun) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unitPrice}
                    onChange={e => setFormData(prev => ({ ...prev, unitPrice: Number(e.target.value) }))}
                    required
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12, fontWeight: 800 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                    Döviz Cinsi
                  </label>
                  <select
                    value={formData.currency}
                    onChange={e => setFormData(prev => ({ ...prev, currency: e.target.value as CurrencyType }))}
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12, fontWeight: 800 }}
                  >
                    <option value="TL">TL (₺)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                    KDV Oranı (%)
                  </label>
                  <select
                    value={formData.vatRate}
                    onChange={e => setFormData(prev => ({ ...prev, vatRate: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12 }}
                  >
                    {vatRates.map(r => (
                      <option key={r.id} value={r.rate}>{r.name} (%{r.rate})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                    Tevkifat Oranı
                  </label>
                  <select
                    value={formData.withholdingRate}
                    onChange={e => setFormData(prev => ({ ...prev, withholdingRate: e.target.value }))}
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12, fontWeight: 700 }}
                  >
                    <option value="5/10">5/10 (Taşımacılık Standart)</option>
                    <option value="2/10">2/10</option>
                    <option value="7/10">7/10</option>
                    <option value="9/10">9/10</option>
                    <option value="Yok">Tevkifatsız (Yok)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                  Özel Notlar & Açıklama
                </label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  placeholder="İrsaliye no, şoför talimatı vb..."
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12 }}
                />
              </div>

              {/* Modal Aksiyon Butonları */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10, borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
                <button type="button" onClick={onCloseNewModal} className="btn btn-secondary" style={{ padding: '7px 16px', fontSize: 12 }}>
                  İptal
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '7px 20px', fontSize: 12 }}>
                  Sevkiyatı Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. ARAÇ ATAMA MODALI */}
      {assignModalShipment && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16
          }}
        >
          <div className="glass-card" style={{ background: '#ffffff', borderRadius: 10, width: 480, padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 900, marginBottom: 12, color: '#0f172a' }}>
              Sefer No: {assignModalShipment.shipmentNo} — Araç & Sürücü Atama
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                  Atanacak Araç / Sürücü:
                </label>
                <select
                  value={selectedVehicleId}
                  onChange={e => setSelectedVehicleId(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12, fontWeight: 700 }}
                >
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.plate} — {v.driverName} ({v.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                  Şoför / Nakliyeci Hakediş Tutarı (TL):
                </label>
                <input
                  type="number"
                  value={driverFreightCost}
                  onChange={e => setDriverFreightCost(Number(e.target.value))}
                  placeholder="0,00"
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12, fontWeight: 800 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setAssignModalShipment(null)} className="btn btn-secondary">
                  Vazgeç
                </button>
                <button type="button" onClick={handleAssignVehicle} className="btn btn-primary">
                  Aracı Sevk Et
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
