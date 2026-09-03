import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Vehicle, VehicleShipmentRow, OrderParamRow } from '../types';
import {
  Truck,
  Plus,
  Save,
  Trash2,
  Search,
  CheckCircle,
  ArrowLeft,
  Layers,
  Tag,
  X,
  FileText,
  Check
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/numberToWords';
import { formatPhoneNumber } from '../utils/phoneFormatter';
import { TURKEY_CITIES_DISTRICTS, CITIES_LIST } from '../utils/turkeyCities';

export const VehicleRegistrationView: React.FC = () => {
  const {
    vehicles,
    customers,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    setActiveTab,
    vatRates,
    defaultVatRate,
    orderParamRows,
    cinsiList,
    syncVehicleShipmentRow,
    removeVehicleShipmentRow
  } = useApp();

  // İl adına göre ilçe listesini getiren yardımcı fonksiyon (Büyük-küçük harf ve Türkçe karakter toleranslı)
  const getDistrictsByCity = (cityName?: string): string[] => {
    if (!cityName) return [];
    const normalized = cityName.trim().toLocaleLowerCase('tr');
    if (normalized.includes('eti bakir') || normalized.includes('eti̇ bakir') || normalized.includes('eti bakır')) {
      return TURKEY_CITIES_DISTRICTS["ETİ BAKIR A.Ş."] || [];
    }
    const matchedKey = Object.keys(TURKEY_CITIES_DISTRICTS).find(
      k => k.toLocaleLowerCase('tr') === normalized
    );
    return matchedKey ? TURKEY_CITIES_DISTRICTS[matchedKey] : [];
  };

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<number>(vehicles[0]?.id || 1);

  // Firma, Nakliyeci ve Aracı için Firma & Cari Listesi (Benzersiz ve Sıralı)
  const customerNames = Array.from(
    new Set(
      [
        ...customers.map(c => c.name),
        'ETİ BAKIR A.Ş.',
        'TOSYALI DEMİR ÇELİK',
        'TÜRKLER TARIM ÜRÜNLERİ',
        'TÜRKLER NAKLİYAT',
        'TÜRKLER NAK.',
        'SARIKAYA NAKLİYAT',
        'MARŞANDİZ',
        'KAYSERİ PROFİL'
      ].filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare('tr'));

  // Tanımlı Yük Seçim Modalı State
  const [isDefinedLoadModalOpen, setIsDefinedLoadModalOpen] = useState<boolean>(false);
  const [targetRowIdForDefinedLoad, setTargetRowIdForDefinedLoad] = useState<number | 'draft' | null>(null);
  const [definedLoadSearch, setDefinedLoadSearch] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState<Partial<Vehicle>>({
    id: 1,
    plate: '',
    trailerPlate: '',
    driverName: '',
    accountType: 'ARAC',
    invoiceTitle: '',
    iban: '',
    licenseOwner: '',
    documentNo: '',
    registrationNo: '',
    brand: 'Mercedes-Benz',
    color: 'Beyaz',
    modelYear: '2022',
    vehicleTypeHeader: 'Çekici',
    chassisNo: '',
    vehicleFeature: 'Kısa Dorse Damperli',
    isProblematic: false,
    problemReason: '',
    drivingLicenseNo: '',
    licenseIssuedPlace: '',
    address: '',
    phone: '',
    workPhone: '',
    reference: '',
    notes: '',
    taxOffice: '',
    taxOrIdNumber: '',
    isActive: true
  });

  const initialShipmentRows: Record<number, VehicleShipmentRow[]> = {
    1: [
      {
        id: 101,
        sNo: '13232',
        definedLoad: 'MERSİN',
        plate: '47 AAC 114 - 55 AAZ 504',
        date: '2026-08-28',
        company: 'ETİ BAKIR',
        transporter: 'TÜRKLER NAKLİYAT',
        intermediary: 'TÜRKLER NAK.',
        loadingPlace: 'SAMSUN',
        unloadingPlace: 'MARDİN',
        unloadingDistrict: 'MERKEZ',
        goodsType: 'DÖKME',
        quantity: 27.12,
        buyPrice: 213.00,
        sellPrice: 215.00,
        vatRate: 18,
        commission: 200,
        notes: 'Dökme maden sevkiyatı',
        dispatchAddress: 'Mardin Organize Sanayi'
      },
      {
        id: 102,
        sNo: '13252',
        definedLoad: 'MERSİN',
        plate: '47 AAC 114 - 55 AAZ 504',
        date: '2026-09-01',
        company: 'ETİ BAKIR',
        transporter: 'TÜRKLER NAKLİYAT',
        intermediary: 'TÜRKLER NAK.',
        loadingPlace: 'ETİ BAKIR',
        unloadingPlace: 'MERSİN',
        unloadingDistrict: 'TARSUS',
        goodsType: 'DEMİROKSİT',
        quantity: 26.50,
        buyPrice: 250.00,
        sellPrice: 260.00,
        vatRate: 18,
        commission: 1000,
        notes: 'Hızlı teslimat',
        dispatchAddress: 'Tarsus Çimento Fabrikası'
      }
    ],
    2: [
      {
        id: 201,
        sNo: '13210',
        definedLoad: 'ANKARA',
        plate: '06 ABC 47 - 06 TRN 88',
        date: '2026-08-20',
        company: 'KAYSERİ PROFİL',
        transporter: 'GEL NAKLİYAT',
        intermediary: 'TÜRKLER NAK.',
        loadingPlace: 'KAYSERİ',
        unloadingPlace: 'ANKARA',
        unloadingDistrict: 'KAZAN',
        goodsType: 'SANAYİ BORUSU',
        quantity: 25.80,
        buyPrice: 180.00,
        sellPrice: 195.00,
        vatRate: 20,
        commission: 387,
        notes: 'Profil boru taşıma',
        dispatchAddress: 'Kazan Lojistik Üssü'
      }
    ]
  };

  // Alt Tablo: Seçili araca ait yük satırları (LocalStorage kalıcılığı ile)
  const [shipmentRows, setShipmentRows] = useState<Record<number, VehicleShipmentRow[]>>(() => {
    const saved = localStorage.getItem('diza_vehicle_shipment_rows');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialShipmentRows;
  });

  useEffect(() => {
    localStorage.setItem('diza_vehicle_shipment_rows', JSON.stringify(shipmentRows));
  }, [shipmentRows]);

  // Access Klasik Boş Taslak Satırı (* Yeni Kayıt)
  const [draftRow, setDraftRow] = useState<Partial<VehicleShipmentRow>>({
    sNo: 'Yeni',
    definedLoad: '',
    plate: '',
    date: new Date().toISOString().split('T')[0],
    company: '',
    transporter: '',
    intermediary: '',
    loadingPlace: '',
    unloadingPlace: '',
    unloadingDistrict: '',
    goodsType: '',
    quantity: undefined,
    buyPrice: undefined,
    sellPrice: undefined,
    vatRate: 18,
    commission: 0,
    notes: '',
    dispatchAddress: ''
  });

  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Seçili aracı forma yükle
  useEffect(() => {
    const current = vehicles.find(v => v.id === selectedVehicleId);
    if (current) {
      setFormData({
        ...current,
        accountType: current.accountType || 'ARAC',
        vehicleFeature: current.vehicleFeature || 'Kısa Dorse Damperli',
        brand: current.brand || 'Mercedes-Benz',
        color: current.color || 'Beyaz',
        modelYear: current.modelYear || '2022',
        vehicleTypeHeader: current.vehicleTypeHeader || 'Çekici',
        isProblematic: current.isProblematic || false
      });
      // Boş satırın varsayılan plakasını hazırla
      setDraftRow(prev => ({
        ...prev,
        plate: `${current.plate || ''} ${current.trailerPlate ? '- ' + current.trailerPlate : ''}`.trim()
      }));
    }
  }, [selectedVehicleId, vehicles]);

  // Arama Filtresi
  const filteredVehicles = vehicles.filter(v => {
    const q = searchTerm.toLowerCase();
    return (
      v.plate.toLowerCase().includes(q) ||
      v.driverName.toLowerCase().includes(q) ||
      (v.invoiceTitle && v.invoiceTitle.toLowerCase().includes(q))
    );
  });

  // Yeni Araç Kayıt Butonu
  const handleNewRecord = () => {
    const nextId = vehicles.length > 0 ? Math.max(...vehicles.map(v => v.id)) + 1 : 1;
    setFormData({
      id: nextId,
      plate: '',
      trailerPlate: '',
      driverName: '',
      accountType: 'ARAC',
      invoiceTitle: '',
      iban: '',
      licenseOwner: '',
      documentNo: '',
      registrationNo: '',
      brand: 'Mercedes-Benz',
      color: 'Beyaz',
      modelYear: new Date().getFullYear().toString(),
      vehicleTypeHeader: 'Çekici',
      chassisNo: '',
      vehicleFeature: 'Kısa Dorse Damperli',
      isProblematic: false,
      problemReason: '',
      drivingLicenseNo: '',
      licenseIssuedPlace: '',
      address: '',
      phone: '',
      workPhone: '',
      reference: '',
      notes: '',
      taxOffice: '',
      taxOrIdNumber: '',
      isActive: true
    });
    setSelectedVehicleId(nextId);
    setSaveMessage('Yeni araç kayıt modu açıldı.');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  // Kaydet Butonu
  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.plate || !formData.driverName) {
      alert('Lütfen Araç Plakası ve Sürücü Adı Soyadı alanlarını doldurunuz.');
      return;
    }

    const exists = vehicles.find(v => v.id === formData.id);

    if (exists) {
      updateVehicle(formData.id!, {
        ...formData,
        plate: formData.plate.toUpperCase(),
        trailerPlate: formData.trailerPlate ? formData.trailerPlate.toUpperCase() : ''
      });
      setSaveMessage('✓ Araç ve sürücü bilgileri başarıyla güncellendi!');
    } else {
      addVehicle({
        plate: formData.plate.toUpperCase(),
        trailerPlate: formData.trailerPlate ? formData.trailerPlate.toUpperCase() : '',
        driverName: formData.driverName,
        accountType: formData.accountType || 'ARAC',
        invoiceTitle: formData.invoiceTitle || '',
        iban: formData.iban || '',
        licenseOwner: formData.licenseOwner || '',
        documentNo: formData.documentNo || '',
        registrationNo: formData.registrationNo || '',
        brand: formData.brand || 'Mercedes-Benz',
        color: formData.color || '',
        modelYear: formData.modelYear || '',
        vehicleTypeHeader: formData.vehicleTypeHeader || '',
        chassisNo: formData.chassisNo || '',
        vehicleFeature: formData.vehicleFeature || 'Kısa Dorse Damperli',
        isProblematic: formData.isProblematic || false,
        problemReason: formData.problemReason || '',
        drivingLicenseNo: formData.drivingLicenseNo || '',
        licenseIssuedPlace: formData.licenseIssuedPlace || '',
        address: formData.address || '',
        phone: formData.phone || '',
        workPhone: formData.workPhone || '',
        reference: formData.reference || '',
        notes: formData.notes || '',
        taxOffice: formData.taxOffice || '',
        taxOrIdNumber: formData.taxOrIdNumber || '',
        location: formData.location || 'Merkez Garaj',
        vehicleType: formData.vehicleFeature || 'Kısa Dorse Damperli',
        capacityTons: formData.capacityTons || 26,
        isActive: formData.isActive ?? true
      });
      setSaveMessage('✓ Yeni araç kaydı başarıyla oluşturuldu!');
    }

    setTimeout(() => setSaveMessage(null), 3000);
  };

  // Kayıt Sil Butonu
  const handleDelete = () => {
    if (!formData.id) return;
    const confirmDel = window.confirm(`${formData.plate || 'Bu'} aracını silmek istediğinize emin misiniz?`);
    if (confirmDel) {
      deleteVehicle(formData.id);
      if (vehicles.length > 1) {
        const remaining = vehicles.filter(v => v.id !== formData.id);
        setSelectedVehicleId(remaining[0].id);
      } else {
        handleNewRecord();
      }
      setSaveMessage('Araç kaydı silindi.');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  // BAŞLANGIÇ & DEĞİŞİKLİKTE MERKEZİ SEVKİYAT LİSTESİNE SENKRONİZASYON
  useEffect(() => {
    // Mevcut araç kayıtlarındaki tüm sefer hareketlerini merkezi shipments listesine aktar
    Object.entries(shipmentRows).forEach(([vehIdStr, rows]) => {
      const vId = Number(vehIdStr);
      const veh = vehicles.find(v => v.id === vId);
      rows.forEach(r => {
        syncVehicleShipmentRow(vId, r, veh?.plate, veh?.driverName);
      });
    });
  }, []);

  // Tanımlı Yükü Sefer Satırına Aktarma Fonksiyonu
  const applyDefinedLoadToRow = (targetId: number | 'draft', paramRow: OrderParamRow) => {
    const qty = Number(paramRow.quantity) || 26;
    const buy = Number(paramRow.buyPrice) || 0;
    const sell = Number(paramRow.sellPrice) || 0;
    const comm = (sell - buy) > 0 ? (sell - buy) * qty : Number(paramRow.commission) || 0;

    if (targetId === 'draft') {
      const newId = Date.now();
      const generatedSNo = String(Math.floor(Math.random() * 9000) + 10000);

      const newRow: VehicleShipmentRow = {
        id: newId,
        sNo: generatedSNo,
        definedLoad: paramRow.loadTitle,
        plate: `${formData.plate || ''} ${formData.trailerPlate ? '- ' + formData.trailerPlate : ''}`.trim(),
        date: new Date().toISOString().split('T')[0],
        company: paramRow.company || '',
        transporter: paramRow.transporter || 'TÜRKLER NAKLİYAT',
        intermediary: paramRow.intermediary || 'TÜRKLER NAK.',
        loadingPlace: paramRow.loadingPlace || '',
        unloadingPlace: paramRow.unloadingPlace || '',
        unloadingDistrict: paramRow.unloadingDistrict || '',
        goodsType: paramRow.goodsType || '',
        quantity: qty,
        buyPrice: buy,
        sellPrice: sell,
        vatRate: Number(paramRow.vatRate) || defaultVatRate,
        commission: comm,
        notes: paramRow.dispatchAddress || '',
        dispatchAddress: paramRow.dispatchAddress || ''
      };

      setShipmentRows(prev => ({
        ...prev,
        [selectedVehicleId]: [...(prev[selectedVehicleId] || []), newRow]
      }));

      // MERKEZİ SEVKİYAT LİSTESİNE SENKRONİZE ET
      syncVehicleShipmentRow(selectedVehicleId, newRow, formData.plate, formData.driverName);

      setDraftRow({
        sNo: 'Yeni',
        definedLoad: '',
        plate: `${formData.plate || ''} ${formData.trailerPlate ? '- ' + formData.trailerPlate : ''}`.trim(),
        date: new Date().toISOString().split('T')[0],
        company: '',
        transporter: 'TÜRKLER NAKLİYAT',
        intermediary: 'TÜRKLER NAK.',
        loadingPlace: '',
        unloadingPlace: '',
        unloadingDistrict: '',
        goodsType: '',
        quantity: undefined,
        buyPrice: undefined,
        sellPrice: undefined,
        vatRate: defaultVatRate,
        commission: 0,
        notes: '',
        dispatchAddress: ''
      });
    } else {
      setShipmentRows(prev => {
        const list = prev[selectedVehicleId] || [];
        const updated = list.map(r => {
          if (r.id === targetId) {
            const u: VehicleShipmentRow = {
              ...r,
              definedLoad: paramRow.loadTitle,
              company: paramRow.company || r.company,
              transporter: paramRow.transporter || r.transporter,
              intermediary: paramRow.intermediary || r.intermediary,
              loadingPlace: paramRow.loadingPlace || r.loadingPlace,
              unloadingPlace: paramRow.unloadingPlace || r.unloadingPlace,
              unloadingDistrict: paramRow.unloadingDistrict || r.unloadingDistrict,
              goodsType: paramRow.goodsType || r.goodsType,
              quantity: qty || r.quantity,
              buyPrice: buy || r.buyPrice,
              sellPrice: sell || r.sellPrice,
              vatRate: Number(paramRow.vatRate) || r.vatRate || defaultVatRate,
              commission: comm || r.commission,
              notes: paramRow.dispatchAddress || r.notes,
              dispatchAddress: paramRow.dispatchAddress || r.dispatchAddress
            };
            syncVehicleShipmentRow(selectedVehicleId, u, formData.plate, formData.driverName);
            return u;
          }
          return r;
        });
        return { ...prev, [selectedVehicleId]: updated };
      });
    }

    setIsDefinedLoadModalOpen(false);
    setTargetRowIdForDefinedLoad(null);
    setSaveMessage(`✓ "${paramRow.loadTitle}" (${paramRow.company}) parametreleri satıra aktarıldı ve Sevkiyat Listesine eklendi.`);
    setTimeout(() => setSaveMessage(null), 3000);
  };

  // Tanımlı Yük İsim veya Kod ile Hızlı Eşleştirme
  const handleDefinedLoadInput = (targetId: number | 'draft', inputVal: string) => {
    if (targetId === 'draft') {
      setDraftRow(prev => ({ ...prev, definedLoad: inputVal }));
    } else {
      handleUpdateRow(targetId, 'definedLoad', inputVal);
    }

    const matched = orderParamRows.find(
      p =>
        p.sip_id.toLowerCase() === inputVal.trim().toLowerCase() ||
        p.loadTitle.toLowerCase() === inputVal.trim().toLowerCase()
    );

    if (matched) {
      applyDefinedLoadToRow(targetId, matched);
    }
  };

  // Alt Tablo: Var Olan Satırı Güncelle
  const currentRows = shipmentRows[selectedVehicleId] || [];

  const handleUpdateRow = (rowId: number, field: keyof VehicleShipmentRow, val: any) => {
    setShipmentRows(prev => {
      const list = prev[selectedVehicleId] || [];
      const updated = list.map(r => {
        if (r.id === rowId) {
          const u = { ...r, [field]: val };
          if (field === 'buyPrice' || field === 'sellPrice' || field === 'quantity') {
            const qty = Number(u.quantity) || 0;
            const buy = Number(u.buyPrice) || 0;
            const sell = Number(u.sellPrice) || 0;
            u.commission = Math.max(0, (sell - buy) * qty);
          }
          // MERKEZİ SEVKİYAT LİSTESİNE SENKRONİZE ET
          syncVehicleShipmentRow(selectedVehicleId, u, formData.plate, formData.driverName);
          return u;
        }
        return r;
      });
      return { ...prev, [selectedVehicleId]: updated };
    });
  };

  // Alt Tablo: Satır Sil
  const handleDeleteRow = (rowId: number) => {
    const targetRow = (shipmentRows[selectedVehicleId] || []).find(r => r.id === rowId);
    if (targetRow) {
      removeVehicleShipmentRow(targetRow.sNo, targetRow.id);
    }
    setShipmentRows(prev => ({
      ...prev,
      [selectedVehicleId]: (prev[selectedVehicleId] || []).filter(r => r.id !== rowId)
    }));
  };

  // OTOMATİK YENİ SATIR AÇMA MEKANİZMASI (Access Style Auto-Append)
  const handleDraftChange = (field: keyof VehicleShipmentRow, val: any) => {
    const updatedDraft = { ...draftRow, [field]: val };

    // Eğer kullanıcı taslak satıra bir şey yazdıysa, hemen tabloya ekle ve yeni bir boş taslak aç
    const hasContent =
      (field === 'company' && val) ||
      (field === 'definedLoad' && val) ||
      (field === 'loadingPlace' && val) ||
      (field === 'unloadingPlace' && val) ||
      (field === 'goodsType' && val) ||
      (field === 'quantity' && val) ||
      (field === 'buyPrice' && val) ||
      (field === 'notes' && val);

    if (hasContent) {
      const newId = Date.now();
      const generatedSNo = String(Math.floor(Math.random() * 9000) + 10000);

      const qty = Number(updatedDraft.quantity) || 0;
      const buy = Number(updatedDraft.buyPrice) || 0;
      const sell = Number(updatedDraft.sellPrice) || 0;
      const comm = (sell - buy) > 0 ? (sell - buy) * qty : Number(updatedDraft.commission) || 0;

      const newRow: VehicleShipmentRow = {
        id: newId,
        sNo: generatedSNo,
        definedLoad: updatedDraft.definedLoad || '',
        plate: updatedDraft.plate || `${formData.plate || ''} ${formData.trailerPlate ? '- ' + formData.trailerPlate : ''}`.trim(),
        date: updatedDraft.date || new Date().toISOString().split('T')[0],
        company: updatedDraft.company || '',
        transporter: updatedDraft.transporter || 'TÜRKLER NAKLİYAT',
        intermediary: updatedDraft.intermediary || 'TÜRKLER NAK.',
        loadingPlace: updatedDraft.loadingPlace || '',
        unloadingPlace: updatedDraft.unloadingPlace || '',
        unloadingDistrict: updatedDraft.unloadingDistrict || '',
        goodsType: updatedDraft.goodsType || '',
        quantity: Number(updatedDraft.quantity) || 0,
        buyPrice: Number(updatedDraft.buyPrice) || 0,
        sellPrice: Number(updatedDraft.sellPrice) || 0,
        vatRate: Number(updatedDraft.vatRate) || 18,
        commission: comm,
        notes: updatedDraft.notes || '',
        dispatchAddress: updatedDraft.dispatchAddress || ''
      };

      // Tabloya ekle
      setShipmentRows(prev => ({
        ...prev,
        [selectedVehicleId]: [...(prev[selectedVehicleId] || []), newRow]
      }));

      // MERKEZİ SEVKİYAT LİSTESİNE SENKRONİZE ET
      syncVehicleShipmentRow(selectedVehicleId, newRow, formData.plate, formData.driverName);

      // Altta otomatik yeni bir boş taslak satırı hazırla
      setDraftRow({
        sNo: 'Yeni',
        definedLoad: '',
        plate: `${formData.plate || ''} ${formData.trailerPlate ? '- ' + formData.trailerPlate : ''}`.trim(),
        date: new Date().toISOString().split('T')[0],
        company: '',
        transporter: 'TÜRKLER NAKLİYAT',
        intermediary: 'TÜRKLER NAK.',
        loadingPlace: '',
        unloadingPlace: '',
        unloadingDistrict: '',
        goodsType: '',
        quantity: undefined,
        buyPrice: undefined,
        sellPrice: undefined,
        vatRate: 18,
        commission: 0,
        notes: '',
        dispatchAddress: ''
      });
    } else {
      setDraftRow(updatedDraft);
    }
  };

  // Toplamlar
  const totalQuantity = currentRows.reduce((s, r) => s + (Number(r.quantity) || 0), 0);
  const totalCommission = currentRows.reduce((s, r) => s + (Number(r.commission) || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Kaydet Bildirim Barı */}
      {saveMessage && (
        <div
          style={{
            background: 'var(--diza-red-light)',
            border: '1.5px solid var(--diza-red)',
            color: 'var(--diza-red-dark)',
            padding: '10px 18px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 800,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <CheckCircle size={18} color="var(--diza-red)" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* 1. Üst Aksiyon & Başlık Barı (Resimdeki: Yeni Kayıt, Kaydet, Kayıt Sil, Çıkış) */}
      <div
        className="glass-card"
        style={{
          padding: '10px 16px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 10,
          background: '#ffffff',
          borderTop: '4px solid var(--diza-red)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 6,
              background: 'var(--diza-red-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--diza-red)',
              fontWeight: 900,
              fontSize: 14
            }}
          >
            {formData.id || 1}
          </div>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 900, color: '#0f172a' }}>
              ARAÇ VE SÜRÜCÜ KAYIT KARTI
            </h3>
          </div>
        </div>

        {/* Buton Grubu (Resimdeki Renk ve Düzen) */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleNewRecord}
            style={{ fontWeight: 800, background: '#3b82f6', color: '#fff', border: 'none' }}
          >
            <Plus size={14} /> Yeni Kayıt
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => handleSave()}
            style={{ fontWeight: 800, background: '#10b981', color: '#fff', border: 'none' }}
          >
            <Save size={14} /> Kaydet
          </button>
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={handleDelete}
            style={{ fontWeight: 800, background: '#ef4444', color: '#fff', border: 'none' }}
          >
            <Trash2 size={14} /> Kayıt Sil
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setActiveTab('dashboard')}
            style={{ background: '#f97316', color: '#fff', fontWeight: 800, border: 'none' }}
          >
            <ArrowLeft size={14} /> Çıkış
          </button>
        </div>
      </div>

      {/* 2. Üst Hızlı Alanlar (Plaka, Dorse, Sürücü Adı, Hesap Seçimi, Fatura, İban) */}
      <div
        className="glass-card"
        style={{
          padding: '10px 16px',
          background: '#ffffff',
          display: 'grid',
          gridTemplateColumns: '1.2fr 1.2fr 1.5fr 1.1fr 1.8fr 2fr',
          gap: 12,
          alignItems: 'center'
        }}
      >
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 800 }}>Araç Plakası</label>
          <input
            type="text"
            className="form-control"
            placeholder="47 aac 114"
            value={formData.plate || ''}
            onChange={e => setFormData({ ...formData, plate: e.target.value })}
            style={{
              fontWeight: 900,
              fontSize: 15,
              color: 'var(--diza-red)',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              padding: '6px 10px'
            }}
            required
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 800 }}>Dorse Plakası</label>
          <input
            type="text"
            className="form-control"
            placeholder="55 aaz 504"
            value={formData.trailerPlate || ''}
            onChange={e => setFormData({ ...formData, trailerPlate: e.target.value })}
            style={{
              fontWeight: 900,
              fontSize: 15,
              color: 'var(--diza-red)',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              padding: '6px 10px'
            }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 800 }}>Sürücü Adı Soyadı</label>
          <input
            type="text"
            className="form-control"
            placeholder="TURAN SERTKAYA"
            value={formData.driverName || ''}
            onChange={e => setFormData({ ...formData, driverName: e.target.value })}
            style={{
              fontWeight: 900,
              fontSize: 14,
              color: 'var(--diza-red)',
              textTransform: 'uppercase',
              padding: '6px 10px'
            }}
            required
          />
        </div>

        {/* Hesap Seçimi (Radio: Araç / Özel) */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 800 }}>Hesap Seçimi</label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '6px 10px',
              background: '#f8fafc',
              border: '1.5px solid var(--border-color)',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 800, cursor: 'pointer', color: '#0f172a' }}>
              <input
                type="radio"
                name="accountType"
                value="ARAC"
                checked={formData.accountType === 'ARAC'}
                onChange={() => setFormData({ ...formData, accountType: 'ARAC' })}
              />
              Araç
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 800, cursor: 'pointer', color: '#0f172a' }}>
              <input
                type="radio"
                name="accountType"
                value="OZEL"
                checked={formData.accountType === 'OZEL'}
                onChange={() => setFormData({ ...formData, accountType: 'OZEL' })}
              />
              Özel
            </label>
          </div>
        </div>

        {/* Taşınan: Fatura Alanı */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 800 }}>Fatura Ünvanı</label>
          <input
            type="text"
            className="form-control"
            placeholder="BUL-TUR ULUS. NAK."
            value={formData.invoiceTitle || ''}
            onChange={e => setFormData({ ...formData, invoiceTitle: e.target.value })}
            style={{ fontSize: 12, padding: '6px 10px', fontWeight: 700 }}
          />
        </div>

        {/* Taşınan: İBAN Alanı */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 800 }}>Banka & İBAN</label>
          <input
            type="text"
            className="form-control"
            placeholder="TR12 3456 ... işbank"
            value={formData.iban || ''}
            onChange={e => setFormData({ ...formData, iban: e.target.value })}
            style={{ fontSize: 12, padding: '6px 10px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
          />
        </div>
      </div>

      {/* 3. Ana Gövde (Sol Liste Paneli + Sağ 2 Sütun Form) */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 16, alignItems: 'stretch' }}>
        {/* Sol Panel: Araç Arama ve Tam Boy ListBox */}
        <div
          className="glass-card"
          style={{
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            background: '#ffffff',
            border: '1.5px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            height: '100%',
            boxSizing: 'border-box'
          }}
        >
          {/* Bul Arama Kutusu (Etiket ve Arama Girişi Aynı Hizada) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 900, color: '#0f172a', whiteSpace: 'nowrap', marginBottom: 0 }}>
              Bul :
            </label>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={15} color="var(--text-dim)" style={{ position: 'absolute', left: 10, top: 10 }} />
              <input
                type="text"
                className="form-control"
                placeholder="Plaka / Şoför ara..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: 32, fontSize: 12, padding: '7px 10px 7px 32px', fontWeight: 700, width: '100%' }}
              />
            </div>
          </div>

          {/* Gerçek ListBox Kutusu (flex: 1 ile tam kart dibine kadar eşit uzanır) */}
          <div
            className="diza-listbox-container"
            style={{
              border: '2px solid #cbd5e1',
              borderRadius: 'var(--radius-md)',
              flex: 1,
              height: '100%',
              minHeight: '260px',
              overflowY: 'scroll',
              background: '#ffffff',
              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {filteredVehicles.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                Kayıtlı araç bulunamadı.
              </div>
            ) : (
              filteredVehicles.map((v, idx) => {
                const isSelected = v.id === selectedVehicleId;
                return (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVehicleId(v.id)}
                    style={{
                      padding: '9px 12px',
                      textAlign: 'left',
                      background: isSelected ? 'var(--diza-red)' : idx % 2 === 1 ? '#f8fafc' : '#ffffff',
                      color: isSelected ? '#ffffff' : '#0f172a',
                      borderBottom: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 8,
                      userSelect: 'none',
                      transition: 'background 0.1s ease'
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {v.plate} - {v.driverName}
                    </span>
                    {v.isProblematic && (
                      <span style={{ color: isSelected ? '#fff' : '#ef4444', fontSize: 11 }}>
                        ⚠️
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Sağ Panel: ARAÇ BİLGİLERİ & SÜRÜCÜ BİLGİLERİ (2 Kutu) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* 1. KUTU: ARAÇ BİLGİLERİ */}
          <div
            className="glass-card"
            style={{
              padding: 14,
              background: '#ffffff',
              border: '1.5px solid #bfdbfe',
              borderRadius: 'var(--radius-lg)'
            }}
          >
            <div
              style={{
                textAlign: 'center',
                paddingBottom: 6,
                marginBottom: 10,
                borderBottom: '2px solid #3b82f6'
              }}
            >
              <h4 style={{ fontSize: 13, fontWeight: 900, color: '#1d4ed8', letterSpacing: 0.5 }}>
                ARAÇ BİLGİLERİ
              </h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Ruhsat Sahibi */}
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', alignItems: 'center', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#334155' }}>Ruhsat Sahibi</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="BUL-TUR"
                  value={formData.licenseOwner || ''}
                  onChange={e => setFormData({ ...formData, licenseOwner: e.target.value })}
                  style={{ padding: '5px 8px', fontSize: 12 }}
                />
              </div>

              {/* Belge No & Tescil */}
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 1fr', alignItems: 'center', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#334155' }}>Belge No & Tescil</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Belge No"
                  value={formData.documentNo || ''}
                  onChange={e => setFormData({ ...formData, documentNo: e.target.value })}
                  style={{ padding: '5px 8px', fontSize: 12 }}
                />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Tescil No"
                  value={formData.registrationNo || ''}
                  onChange={e => setFormData({ ...formData, registrationNo: e.target.value })}
                  style={{ padding: '5px 8px', fontSize: 12 }}
                />
              </div>

              {/* Markası */}
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', alignItems: 'center', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#334155' }}>Markası</label>
                <select
                  className="form-control"
                  value={formData.brand || 'Mercedes-Benz'}
                  onChange={e => setFormData({ ...formData, brand: e.target.value })}
                  style={{ padding: '5px 8px', fontSize: 12 }}
                >
                  <option value="Mercedes-Benz">Mercedes-Benz</option>
                  <option value="Scania">Scania</option>
                  <option value="Volvo">Volvo</option>
                  <option value="Ford Trucks">Ford Trucks</option>
                  <option value="MAN">MAN</option>
                  <option value="DAF">DAF</option>
                  <option value="Renault Trucks">Renault Trucks</option>
                  <option value="Iveco">Iveco</option>
                </select>
              </div>

              {/* Rengi & Modeli */}
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 1fr', alignItems: 'center', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#334155' }}>Rengi & Modeli</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Beyaz"
                  value={formData.color || ''}
                  onChange={e => setFormData({ ...formData, color: e.target.value })}
                  style={{ padding: '5px 8px', fontSize: 12 }}
                />
                <input
                  type="text"
                  className="form-control"
                  placeholder="2022"
                  value={formData.modelYear || ''}
                  onChange={e => setFormData({ ...formData, modelYear: e.target.value })}
                  style={{ padding: '5px 8px', fontSize: 12 }}
                />
              </div>

              {/* Tipi & Şase No */}
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 1fr', alignItems: 'center', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#334155' }}>Tipi & Şase No</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Çekici"
                  value={formData.vehicleTypeHeader || ''}
                  onChange={e => setFormData({ ...formData, vehicleTypeHeader: e.target.value })}
                  style={{ padding: '5px 8px', fontSize: 12 }}
                />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Şase No"
                  value={formData.chassisNo || ''}
                  onChange={e => setFormData({ ...formData, chassisNo: e.target.value })}
                  style={{ padding: '5px 8px', fontSize: 12, fontFamily: 'var(--font-mono)' }}
                />
              </div>

              {/* Aracın Özelliği */}
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', alignItems: 'center', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#334155' }}>Aracın Özelliği</label>
                <select
                  className="form-control"
                  value={formData.vehicleFeature || 'Kısa Dorse Damperli'}
                  onChange={e => setFormData({ ...formData, vehicleFeature: e.target.value })}
                  style={{ padding: '5px 8px', fontSize: 12 }}
                >
                  <option value="Kısa Dorse Damperli">Kısa Dorse Damperli</option>
                  <option value="Tenteli Dorse (13.60)">Tenteli Dorse (13.60)</option>
                  <option value="Açık Kasa Sac Dorse">Açık Kasa Sac Dorse</option>
                  <option value="Frigofirik Dorse">Frigofirik Dorse</option>
                  <option value="Kamyon (Kırkayak)">Kamyon (Kırkayak)</option>
                  <option value="Konteyner Taşıyıcı">Konteyner Taşıyıcı</option>
                  <option value="Silobas">Silobas</option>
                  <option value="Lowbed">Lowbed</option>
                </select>
              </div>

              {/* Problemli mi? */}
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', alignItems: 'center', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#b91c1c' }}>Problemli mi?</label>
                <select
                  className="form-control"
                  value={formData.isProblematic ? 'Evet' : 'Hayır'}
                  onChange={e => setFormData({ ...formData, isProblematic: e.target.value === 'Evet' })}
                  style={{
                    padding: '5px 8px',
                    fontSize: 12,
                    fontWeight: 800,
                    background: formData.isProblematic ? '#fee2e2' : '#ffffff',
                    color: formData.isProblematic ? '#b91c1c' : '#0f172a'
                  }}
                >
                  <option value="Hayır">Hayır</option>
                  <option value="Evet">Evet</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. KUTU: SÜRÜCÜ VEYA KİŞİSEL BİLGİLER */}
          <div
            className="glass-card"
            style={{
              padding: 14,
              background: '#ffffff',
              border: '1.5px solid #a7f3d0',
              borderRadius: 'var(--radius-lg)'
            }}
          >
            <div
              style={{
                textAlign: 'center',
                paddingBottom: 6,
                marginBottom: 10,
                borderBottom: '2px solid #10b981'
              }}
            >
              <h4 style={{ fontSize: 13, fontWeight: 900, color: '#047857', letterSpacing: 0.5 }}>
                SÜRÜCÜ VEYA KİŞİSEL BİLGİLER
              </h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Ehliyet No & Alındığı Yer */}
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', alignItems: 'center', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#334155' }}>Ehliyet No & Yer</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ehliyet No"
                  value={formData.drivingLicenseNo || ''}
                  onChange={e => setFormData({ ...formData, drivingLicenseNo: e.target.value })}
                  style={{ padding: '5px 8px', fontSize: 12 }}
                />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Alındığı İl"
                  value={formData.licenseIssuedPlace || ''}
                  onChange={e => setFormData({ ...formData, licenseIssuedPlace: e.target.value })}
                  style={{ padding: '5px 8px', fontSize: 12 }}
                />
              </div>

              {/* Adres */}
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#334155' }}>Adres</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Adres"
                  value={formData.address || ''}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  style={{ padding: '5px 8px', fontSize: 12 }}
                />
              </div>

              {/* Cep & İş Telefonu */}
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', alignItems: 'center', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#334155' }}>Cep & İş Tel</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="0(542) 482 87 00"
                  value={formData.phone || ''}
                  onChange={e => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })}
                  style={{ padding: '5px 8px', fontSize: 12, fontWeight: 700 }}
                />
                <input
                  type="text"
                  className="form-control"
                  placeholder="0(324) 238 11 22"
                  value={formData.workPhone || ''}
                  onChange={e => setFormData({ ...formData, workPhone: formatPhoneNumber(e.target.value) })}
                  style={{ padding: '5px 8px', fontSize: 12 }}
                />
              </div>

              {/* Referans */}
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#334155' }}>Referans</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Referans"
                  value={formData.reference || ''}
                  onChange={e => setFormData({ ...formData, reference: e.target.value })}
                  style={{ padding: '5px 8px', fontSize: 12 }}
                />
              </div>

              {/* Açıklama */}
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#334155' }}>Açıklama</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Açıklama notları..."
                  value={formData.notes || ''}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  style={{ padding: '5px 8px', fontSize: 12 }}
                />
              </div>

              {/* V.D. & V.No / TC */}
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', alignItems: 'center', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#334155' }}>V.D. & V.No/TC</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="V. Dairesi"
                  value={formData.taxOffice || ''}
                  onChange={e => setFormData({ ...formData, taxOffice: e.target.value })}
                  style={{ padding: '5px 8px', fontSize: 12 }}
                />
                <input
                  type="text"
                  className="form-control"
                  placeholder="V.No / TC"
                  value={formData.taxOrIdNumber || ''}
                  onChange={e => setFormData({ ...formData, taxOrIdNumber: e.target.value })}
                  style={{ padding: '5px 8px', fontSize: 12, fontFamily: 'var(--font-mono)' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. ALT TABLO: ARACIN GERÇEKLEŞTİRDİĞİ YÜKLER / SEFERLER (Otomatik Açılan Satır Mantığı) */}
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
        {/* Alt Tablo Başlık Barı */}
        <div
          style={{
            padding: '8px 16px',
            background: '#f1f5f9',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={16} color="var(--diza-red)" />
            <strong style={{ fontSize: 13, color: '#0f172a' }}>
              ARACA AİT SEFER VE YÜK HAREKETLERİ LİSTESİ ({currentRows.length} Sefer)
            </strong>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            * En alttaki boş satıra veri girdikçe otomatik yeni satır açılır
          </span>
        </div>

        {/* Excel / Access Tarzı Alt Grid */}
        <div style={{ overflowX: 'auto', maxHeight: '300px' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 11,
              whiteSpace: 'nowrap'
            }}
          >
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', color: '#475569' }}>
                <th style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>S.No</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', borderRight: '1px solid #e2e8f0' }}>Tanımlı Yük</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', borderRight: '1px solid #e2e8f0' }}>Plaka</th>
                <th style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>Tarih</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', borderRight: '1px solid #e2e8f0' }}>Firma</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', borderRight: '1px solid #e2e8f0' }}>Nakliyeci</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', borderRight: '1px solid #e2e8f0' }}>Aracı</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', borderRight: '1px solid #e2e8f0' }}>Yükleme Yeri</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', borderRight: '1px solid #e2e8f0' }}>İndirme Yeri</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', borderRight: '1px solid #e2e8f0' }}>İndirme İlçesi</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', borderRight: '1px solid #e2e8f0' }}>Cinsi</th>
                <th style={{ padding: '6px 8px', textAlign: 'right', borderRight: '1px solid #e2e8f0' }}>Miktar</th>
                <th style={{ padding: '6px 8px', textAlign: 'right', borderRight: '1px solid #e2e8f0' }}>AL_Fiyat</th>
                <th style={{ padding: '6px 8px', textAlign: 'right', borderRight: '1px solid #e2e8f0' }}>Sat_Fiyat</th>
                <th style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>KDV</th>
                <th style={{ padding: '6px 8px', textAlign: 'right', borderRight: '1px solid #e2e8f0', color: 'var(--diza-red)' }}>Komisyon</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', borderRight: '1px solid #e2e8f0' }}>Not</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', borderRight: '1px solid #e2e8f0' }}>sevk_adresi</th>
                <th style={{ padding: '6px 8px', textAlign: 'center' }}>Sil</th>
              </tr>
            </thead>
            <tbody>
              {/* 1. Kayıtlı Satırlar */}
              {currentRows.map((r, idx) => (
                <tr
                  key={r.id}
                  style={{
                    borderBottom: '1px solid #e2e8f0',
                    background: idx % 2 === 1 ? '#fff1f2' : '#ffffff'
                  }}
                >
                  {/* S.No */}
                  <td style={{ padding: '4px 6px', textAlign: 'center', borderRight: '1px solid #e2e8f0', fontWeight: 800, color: 'var(--diza-red)', fontFamily: 'var(--font-mono)' }}>
                    {r.sNo}
                  </td>

                  {/* Tanımlı Yük (Klavye ile Kod/İsim yazınca veya Butona basınca otomatik doldurur) */}
                  <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <input
                        type="text"
                        value={r.definedLoad || ''}
                        onChange={e => handleDefinedLoadInput(r.id, e.target.value)}
                        placeholder="Kod / İsim"
                        title="Parametrelerdeki sip_id veya yük adını yazınız"
                        style={{ width: 85, padding: '3px 4px', border: '1px solid #cbd5e1', borderRadius: 3, fontSize: 11, fontWeight: 700, color: '#1e40af' }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setTargetRowIdForDefinedLoad(r.id);
                          setDefinedLoadSearch('');
                          setIsDefinedLoadModalOpen(true);
                        }}
                        style={{
                          background: '#eff6ff',
                          border: '1px solid #93c5fd',
                          color: '#1d4ed8',
                          borderRadius: 3,
                          padding: '3px 5px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Parametrelerdeki Tanımlı Yük Listesini Aç ve Seç"
                      >
                        <Tag size={12} />
                      </button>
                    </div>
                  </td>

                  {/* Plaka */}
                  <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                    <input
                      type="text"
                      value={r.plate}
                      onChange={e => handleUpdateRow(r.id, 'plate', e.target.value)}
                      style={{ width: 140, padding: '3px 4px', border: '1px solid #cbd5e1', borderRadius: 3, fontSize: 11, fontFamily: 'var(--font-mono)' }}
                    />
                  </td>

                  {/* Tarih */}
                  <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                    <input
                      type="date"
                      value={r.date}
                      onChange={e => handleUpdateRow(r.id, 'date', e.target.value)}
                      style={{ width: 110, padding: '3px 4px', border: '1px solid #cbd5e1', borderRadius: 3, fontSize: 11 }}
                    />
                  </td>

                  {/* Firma (Cariler Listesinden Seçim) */}
                  <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                    <select
                      value={r.company || ''}
                      onChange={e => handleUpdateRow(r.id, 'company', e.target.value)}
                      style={{
                        width: 140,
                        padding: '3px 4px',
                        border: '1px solid #cbd5e1',
                        borderRadius: 3,
                        fontSize: 11,
                        fontWeight: 700,
                        background: '#ffffff',
                        color: '#0f172a'
                      }}
                    >
                      <option value="">-- Firma Seç --</option>
                      {/* Mevcut değer listede yoksa koru */}
                      {r.company && !customers.some(c => c.name === r.company) && (
                        <option value={r.company}>{r.company}</option>
                      )}
                      {customers.map(c => (
                        <option key={c.id} value={c.name}>
                          [{c.id}] {c.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Nakliyeci (Cariler Listesinden Seçim) */}
                  <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                    <select
                      value={r.transporter || ''}
                      onChange={e => handleUpdateRow(r.id, 'transporter', e.target.value)}
                      style={{
                        width: 130,
                        padding: '3px 4px',
                        border: '1px solid #cbd5e1',
                        borderRadius: 3,
                        fontSize: 11,
                        background: '#ffffff',
                        color: '#0f172a'
                      }}
                    >
                      <option value="">-- Nakliyeci Seç --</option>
                      {r.transporter && !customers.some(c => c.name === r.transporter) && (
                        <option value={r.transporter}>{r.transporter}</option>
                      )}
                      {customers.map(c => (
                        <option key={c.id} value={c.name}>
                          [{c.id}] {c.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Aracı (Cariler Listesinden Seçim) */}
                  <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                    <select
                      value={r.intermediary || ''}
                      onChange={e => handleUpdateRow(r.id, 'intermediary', e.target.value)}
                      style={{
                        width: 130,
                        padding: '3px 4px',
                        border: '1px solid #cbd5e1',
                        borderRadius: 3,
                        fontSize: 11,
                        background: '#ffffff',
                        color: '#0f172a'
                      }}
                    >
                      <option value="">-- Aracı Seç --</option>
                      {r.intermediary && !customers.some(c => c.name === r.intermediary) && (
                        <option value={r.intermediary}>{r.intermediary}</option>
                      )}
                      {customers.map(c => (
                        <option key={c.id} value={c.name}>
                          [{c.id}] {c.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Yükleme Yeri (81 İl Listesinden Seçim) */}
                  <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                    <select
                      value={r.loadingPlace || ''}
                      onChange={e => handleUpdateRow(r.id, 'loadingPlace', e.target.value)}
                      style={{
                        width: 110,
                        padding: '3px 4px',
                        border: '1px solid #cbd5e1',
                        borderRadius: 3,
                        fontSize: 11,
                        background: '#ffffff',
                        color: '#047857',
                        fontWeight: 700
                      }}
                    >
                      <option value="">-- İl Seç --</option>
                      {r.loadingPlace && !CITIES_LIST.some(c => c.toLocaleLowerCase('tr') === r.loadingPlace.toLocaleLowerCase('tr')) && (
                        <option value={r.loadingPlace}>{r.loadingPlace}</option>
                      )}
                      {CITIES_LIST.map(city => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* İndirme Yeri (81 İl Listesinden Seçim) */}
                  <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                    <select
                      value={r.unloadingPlace || ''}
                      onChange={e => {
                        const newCity = e.target.value;
                        handleUpdateRow(r.id, 'unloadingPlace', newCity);
                        const dists = getDistrictsByCity(newCity);
                        if (dists.length > 0) {
                          handleUpdateRow(r.id, 'unloadingDistrict', dists[0]);
                        }
                      }}
                      style={{
                        width: 110,
                        padding: '3px 4px',
                        border: '1px solid #cbd5e1',
                        borderRadius: 3,
                        fontSize: 11,
                        background: '#ffffff',
                        color: '#b91c1c',
                        fontWeight: 700
                      }}
                    >
                      <option value="">-- İl Seç --</option>
                      {r.unloadingPlace && !CITIES_LIST.some(c => c.toLocaleLowerCase('tr') === r.unloadingPlace.toLocaleLowerCase('tr')) && (
                        <option value={r.unloadingPlace}>{r.unloadingPlace}</option>
                      )}
                      {CITIES_LIST.map(city => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* İndirme İlçesi (Seçilen İle Ait İlçe Listesinden Seçim) */}
                  <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                    {(() => {
                      const districts = getDistrictsByCity(r.unloadingPlace);
                      return (
                        <select
                          value={r.unloadingDistrict || ''}
                          onChange={e => handleUpdateRow(r.id, 'unloadingDistrict', e.target.value)}
                          style={{
                            width: 100,
                            padding: '3px 4px',
                            border: '1px solid #cbd5e1',
                            borderRadius: 3,
                            fontSize: 11,
                            background: '#ffffff',
                            color: '#0f172a'
                          }}
                        >
                          <option value="">{districts.length > 0 ? '-- İlçe Seç --' : '-- Önce İl --'}</option>
                          {r.unloadingDistrict && !districts.includes(r.unloadingDistrict) && (
                            <option value={r.unloadingDistrict}>{r.unloadingDistrict}</option>
                          )}
                          {districts.map(dist => (
                            <option key={dist} value={dist}>
                              {dist}
                            </option>
                          ))}
                        </select>
                      );
                    })()}
                  </td>

                  {/* Cinsi (Parametrelerdeki Cinsi Listesinden Seçim) */}
                  <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                    <select
                      value={r.goodsType || ''}
                      onChange={e => handleUpdateRow(r.id, 'goodsType', e.target.value)}
                      style={{
                        width: 100,
                        padding: '3px 4px',
                        border: '1px solid #cbd5e1',
                        borderRadius: 3,
                        fontSize: 11,
                        background: '#ffffff',
                        color: '#0f172a',
                        fontWeight: 700
                      }}
                    >
                      <option value="">-- Cinsi Seç --</option>
                      {r.goodsType && !cinsiList.some(c => c.name.toLocaleLowerCase('tr') === r.goodsType.toLocaleLowerCase('tr')) && (
                        <option value={r.goodsType}>{r.goodsType}</option>
                      )}
                      {cinsiList.map(c => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Miktar */}
                  <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                    <input
                      type="number"
                      step="0.01"
                      value={r.quantity}
                      onChange={e => handleUpdateRow(r.id, 'quantity', Number(e.target.value))}
                      style={{ width: 65, textAlign: 'right', padding: '3px 4px', border: '1px solid #cbd5e1', borderRadius: 3, fontSize: 11, fontWeight: 800 }}
                    />
                  </td>

                  {/* AL_Fiyat */}
                  <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                    <input
                      type="number"
                      step="0.01"
                      value={r.buyPrice}
                      onChange={e => handleUpdateRow(r.id, 'buyPrice', Number(e.target.value))}
                      style={{ width: 70, textAlign: 'right', padding: '3px 4px', border: '1px solid #cbd5e1', borderRadius: 3, fontSize: 11, fontFamily: 'var(--font-mono)' }}
                    />
                  </td>

                  {/* Sat_Fiyat */}
                  <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                    <input
                      type="number"
                      step="0.01"
                      value={r.sellPrice}
                      onChange={e => handleUpdateRow(r.id, 'sellPrice', Number(e.target.value))}
                      style={{ width: 70, textAlign: 'right', padding: '3px 4px', border: '1px solid #cbd5e1', borderRadius: 3, fontSize: 11, fontFamily: 'var(--font-mono)' }}
                    />
                  </td>

                  {/* KDV */}
                  <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <select
                      value={r.vatRate !== undefined ? r.vatRate : defaultVatRate}
                      onChange={e => handleUpdateRow(r.id, 'vatRate', Number(e.target.value))}
                      style={{ padding: '3px 4px', border: '1px solid #cbd5e1', borderRadius: 3, fontSize: 11, fontWeight: 800, color: '#1d4ed8', background: '#fff' }}
                    >
                      {vatRates.map(v => (
                        <option key={v.id} value={v.rate}>%{v.rate}</option>
                      ))}
                    </select>
                  </td>

                  {/* Komisyon */}
                  <td style={{ padding: '4px 8px', textAlign: 'right', borderRight: '1px solid #e2e8f0', fontWeight: 900, color: '#b91c1c', fontFamily: 'var(--font-mono)' }}>
                    {Number(r.commission || 0).toLocaleString('tr-TR')}
                  </td>

                  {/* Not */}
                  <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                    <input
                      type="text"
                      value={r.notes || ''}
                      onChange={e => handleUpdateRow(r.id, 'notes', e.target.value)}
                      style={{ width: 100, padding: '3px 4px', border: '1px solid #cbd5e1', borderRadius: 3, fontSize: 11 }}
                    />
                  </td>

                  {/* sevk_adresi */}
                  <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                    <input
                      type="text"
                      value={r.dispatchAddress || ''}
                      onChange={e => handleUpdateRow(r.id, 'dispatchAddress', e.target.value)}
                      style={{ width: 120, padding: '3px 4px', border: '1px solid #cbd5e1', borderRadius: 3, fontSize: 11 }}
                    />
                  </td>

                  {/* Sil */}
                  <td style={{ padding: '2px 4px', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(r.id)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}
                      title="Seferi Sil"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}

              {/* 2. EN ALTTAKİ DAİMİ BOŞ TASLAK SATIRI (* YENİ KAYIT) */}
              <tr style={{ background: '#fef2f2', borderTop: '2px dashed #fca5a5' }}>
                {/* * Yeni S.No */}
                <td style={{ padding: '4px 6px', textAlign: 'center', borderRight: '1px solid #e2e8f0', fontWeight: 900, color: 'var(--diza-red)', fontFamily: 'var(--font-mono)' }}>
                  * Yeni
                </td>

                {/* Tanımlı Yük */}
                <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <input
                      type="text"
                      value={draftRow.definedLoad || ''}
                      onChange={e => handleDefinedLoadInput('draft', e.target.value)}
                      placeholder="Kod / İsim"
                      title="Parametrelerdeki sip_id veya yük adını yazınız"
                      style={{ width: 85, padding: '3px 4px', border: '1.5px solid #f87171', borderRadius: 3, fontSize: 11, background: '#fff', fontWeight: 700, color: '#1e40af' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setTargetRowIdForDefinedLoad('draft');
                        setDefinedLoadSearch('');
                        setIsDefinedLoadModalOpen(true);
                      }}
                      style={{
                        background: '#fee2e2',
                        border: '1px solid #fca5a5',
                        color: '#b91c1c',
                        borderRadius: 3,
                        padding: '3px 5px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Parametrelerdeki Tanımlı Yük Listesini Aç ve Yeni Satıra Aktar"
                    >
                      <Tag size={12} />
                    </button>
                  </div>
                </td>

                {/* Plaka */}
                <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                  <input
                    type="text"
                    value={draftRow.plate || ''}
                    onChange={e => handleDraftChange('plate', e.target.value)}
                    placeholder="Plaka"
                    style={{ width: 140, padding: '3px 4px', border: '1px solid #f87171', borderRadius: 3, fontSize: 11, fontFamily: 'var(--font-mono)', background: '#fff' }}
                  />
                </td>

                {/* Tarih */}
                <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                  <input
                    type="date"
                    value={draftRow.date || ''}
                    onChange={e => handleDraftChange('date', e.target.value)}
                    style={{ width: 110, padding: '3px 4px', border: '1px solid #f87171', borderRadius: 3, fontSize: 11, background: '#fff' }}
                  />
                </td>

                {/* Firma (Cariler Listesinden Seçim) */}
                <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                  <select
                    value={draftRow.company || ''}
                    onChange={e => handleDraftChange('company', e.target.value)}
                    style={{
                      width: 140,
                      padding: '3px 4px',
                      border: '1.5px solid var(--diza-red)',
                      borderRadius: 3,
                      fontSize: 11,
                      fontWeight: 800,
                      background: '#fff',
                      color: '#0f172a'
                    }}
                  >
                    <option value="">-- Firma Seç --</option>
                    {draftRow.company && !customers.some(c => c.name === draftRow.company) && (
                      <option value={draftRow.company}>{draftRow.company}</option>
                    )}
                    {customers.map(c => (
                      <option key={c.id} value={c.name}>
                        [{c.id}] {c.name}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Nakliyeci (Cariler Listesinden Seçim) */}
                <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                  <select
                    value={draftRow.transporter || ''}
                    onChange={e => handleDraftChange('transporter', e.target.value)}
                    style={{
                      width: 130,
                      padding: '3px 4px',
                      border: '1px solid #f87171',
                      borderRadius: 3,
                      fontSize: 11,
                      background: '#fff',
                      color: '#0f172a'
                    }}
                  >
                    <option value="">-- Nakliyeci Seç --</option>
                    {draftRow.transporter && !customers.some(c => c.name === draftRow.transporter) && (
                      <option value={draftRow.transporter}>{draftRow.transporter}</option>
                    )}
                    {customers.map(c => (
                      <option key={c.id} value={c.name}>
                        [{c.id}] {c.name}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Aracı (Cariler Listesinden Seçim) */}
                <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                  <select
                    value={draftRow.intermediary || ''}
                    onChange={e => handleDraftChange('intermediary', e.target.value)}
                    style={{
                      width: 130,
                      padding: '3px 4px',
                      border: '1px solid #f87171',
                      borderRadius: 3,
                      fontSize: 11,
                      background: '#fff',
                      color: '#0f172a'
                    }}
                  >
                    <option value="">-- Aracı Seç --</option>
                    {draftRow.intermediary && !customers.some(c => c.name === draftRow.intermediary) && (
                      <option value={draftRow.intermediary}>{draftRow.intermediary}</option>
                    )}
                    {customers.map(c => (
                      <option key={c.id} value={c.name}>
                        [{c.id}] {c.name}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Yükleme Yeri (81 İl Listesinden Seçim) */}
                <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                  <select
                    value={draftRow.loadingPlace || ''}
                    onChange={e => handleDraftChange('loadingPlace', e.target.value)}
                    style={{
                      width: 110,
                      padding: '3px 4px',
                      border: '1px solid #f87171',
                      borderRadius: 3,
                      fontSize: 11,
                      background: '#fff',
                      color: '#047857',
                      fontWeight: 700
                    }}
                  >
                    <option value="">-- İl Seç --</option>
                    {draftRow.loadingPlace && !CITIES_LIST.some(c => c.toLocaleLowerCase('tr') === draftRow.loadingPlace?.toLocaleLowerCase('tr')) && (
                      <option value={draftRow.loadingPlace}>{draftRow.loadingPlace}</option>
                    )}
                    {CITIES_LIST.map(city => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </td>

                {/* İndirme Yeri (81 İl Listesinden Seçim) */}
                <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                  <select
                    value={draftRow.unloadingPlace || ''}
                    onChange={e => {
                      const newCity = e.target.value;
                      const dists = getDistrictsByCity(newCity);
                      const updatedDraft = {
                        ...draftRow,
                        unloadingPlace: newCity,
                        unloadingDistrict: dists.length > 0 ? dists[0] : ''
                      };
                      handleDraftChange('unloadingPlace', newCity);
                      if (dists.length > 0) {
                        setDraftRow(prev => ({ ...prev, unloadingDistrict: dists[0] }));
                      }
                    }}
                    style={{
                      width: 110,
                      padding: '3px 4px',
                      border: '1px solid #f87171',
                      borderRadius: 3,
                      fontSize: 11,
                      background: '#fff',
                      color: '#b91c1c',
                      fontWeight: 700
                    }}
                  >
                    <option value="">-- İl Seç --</option>
                    {draftRow.unloadingPlace && !CITIES_LIST.some(c => c.toLocaleLowerCase('tr') === draftRow.unloadingPlace?.toLocaleLowerCase('tr')) && (
                      <option value={draftRow.unloadingPlace}>{draftRow.unloadingPlace}</option>
                    )}
                    {CITIES_LIST.map(city => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </td>

                {/* İndirme İlçesi (Seçilen İle Ait İlçe Listesinden Seçim) */}
                <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                  {(() => {
                    const districts = getDistrictsByCity(draftRow.unloadingPlace);
                    return (
                      <select
                        value={draftRow.unloadingDistrict || ''}
                        onChange={e => handleDraftChange('unloadingDistrict', e.target.value)}
                        style={{
                          width: 100,
                          padding: '3px 4px',
                          border: '1px solid #f87171',
                          borderRadius: 3,
                          fontSize: 11,
                          background: '#fff',
                          color: '#0f172a'
                        }}
                      >
                        <option value="">{districts.length > 0 ? '-- İlçe Seç --' : '-- Önce İl --'}</option>
                        {draftRow.unloadingDistrict && !districts.includes(draftRow.unloadingDistrict) && (
                          <option value={draftRow.unloadingDistrict}>{draftRow.unloadingDistrict}</option>
                        )}
                        {districts.map(dist => (
                          <option key={dist} value={dist}>
                            {dist}
                          </option>
                        ))}
                      </select>
                    );
                  })()}
                </td>

                {/* Cinsi (Parametrelerdeki Cinsi Listesinden Seçim) */}
                <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                  <select
                    value={draftRow.goodsType || ''}
                    onChange={e => handleDraftChange('goodsType', e.target.value)}
                    style={{
                      width: 100,
                      padding: '3px 4px',
                      border: '1px solid #f87171',
                      borderRadius: 3,
                      fontSize: 11,
                      background: '#fff',
                      color: '#0f172a',
                      fontWeight: 700
                    }}
                  >
                    <option value="">-- Cinsi Seç --</option>
                    {draftRow.goodsType && !cinsiList.some(c => c.name.toLocaleLowerCase('tr') === draftRow.goodsType?.toLocaleLowerCase('tr')) && (
                      <option value={draftRow.goodsType}>{draftRow.goodsType}</option>
                    )}
                    {cinsiList.map(c => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Miktar */}
                <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                  <input
                    type="number"
                    step="0.01"
                    value={draftRow.quantity !== undefined ? draftRow.quantity : ''}
                    onChange={e => handleDraftChange('quantity', e.target.value)}
                    placeholder="0.00"
                    style={{ width: 65, textAlign: 'right', padding: '3px 4px', border: '1px solid #f87171', borderRadius: 3, fontSize: 11, background: '#fff' }}
                  />
                </td>

                {/* AL_Fiyat */}
                <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                  <input
                    type="number"
                    step="0.01"
                    value={draftRow.buyPrice !== undefined ? draftRow.buyPrice : ''}
                    onChange={e => handleDraftChange('buyPrice', e.target.value)}
                    placeholder="0.00"
                    style={{ width: 70, textAlign: 'right', padding: '3px 4px', border: '1px solid #f87171', borderRadius: 3, fontSize: 11, background: '#fff' }}
                  />
                </td>

                {/* Sat_Fiyat */}
                <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                  <input
                    type="number"
                    step="0.01"
                    value={draftRow.sellPrice !== undefined ? draftRow.sellPrice : ''}
                    onChange={e => handleDraftChange('sellPrice', e.target.value)}
                    placeholder="0.00"
                    style={{ width: 70, textAlign: 'right', padding: '3px 4px', border: '1px solid #f87171', borderRadius: 3, fontSize: 11, background: '#fff' }}
                  />
                </td>

                {/* KDV */}
                <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <select
                    value={draftRow.vatRate !== undefined ? draftRow.vatRate : defaultVatRate}
                    onChange={e => handleDraftChange('vatRate', Number(e.target.value))}
                    style={{ padding: '3px 4px', border: '1px solid var(--diza-red)', borderRadius: 3, fontSize: 11, fontWeight: 800, color: 'var(--diza-red)', background: '#fff' }}
                  >
                    {vatRates.map(v => (
                      <option key={v.id} value={v.rate}>%{v.rate}</option>
                    ))}
                  </select>
                </td>

                {/* Komisyon */}
                <td style={{ padding: '4px 8px', textAlign: 'right', borderRight: '1px solid #e2e8f0', color: 'var(--text-muted)' }}>
                  -
                </td>

                {/* Not */}
                <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                  <input
                    type="text"
                    value={draftRow.notes || ''}
                    onChange={e => handleDraftChange('notes', e.target.value)}
                    placeholder="Not..."
                    style={{ width: 100, padding: '3px 4px', border: '1px solid #f87171', borderRadius: 3, fontSize: 11, background: '#fff' }}
                  />
                </td>

                {/* sevk_adresi */}
                <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                  <input
                    type="text"
                    value={draftRow.dispatchAddress || ''}
                    onChange={e => handleDraftChange('dispatchAddress', e.target.value)}
                    placeholder="Adres..."
                    style={{ width: 120, padding: '3px 4px', border: '1px solid #f87171', borderRadius: 3, fontSize: 11, background: '#fff' }}
                  />
                </td>

                {/* Sil İkonu Taslakta Boş */}
                <td style={{ padding: '2px 4px', textAlign: 'center', color: 'var(--text-dim)' }}>
                  *
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 5. Alt Durum Çubuğu (Status Bar) */}
        <div
          style={{
            padding: '8px 16px',
            background: '#ffedd5',
            borderTop: '1.5px solid #fdba74',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 12,
            fontWeight: 800,
            color: '#9a3412'
          }}
        >
          <div>
            <span>{vehicles.length} Araç Listelendi...</span>
            <span style={{ marginLeft: 16, color: '#c2410c' }}>
              Seçili Araç: <strong>{formData.plate || '-'} ({formData.driverName || '-'})</strong>
            </span>
          </div>

          <div style={{ display: 'flex', gap: 20 }}>
            <span>Toplam Tonaj: <strong>{totalQuantity.toFixed(2)} Ton</strong></span>
            <span>Toplam Komisyon: <strong>{totalCommission.toLocaleString('tr-TR')} TL</strong></span>
          </div>
        </div>
      </div>

      {/* 5. TANIMLI SİPARİŞ & SEVKİYAT YÜKLERİ SEÇİM MODALI */}
      {isDefinedLoadModalOpen && (() => {
        const filteredParamLoads = orderParamRows.filter(p => {
          const q = definedLoadSearch.toLowerCase();
          return (
            p.sip_id.toLowerCase().includes(q) ||
            p.loadTitle.toLowerCase().includes(q) ||
            p.company.toLowerCase().includes(q) ||
            p.loadingPlace.toLowerCase().includes(q) ||
            p.unloadingPlace.toLowerCase().includes(q) ||
            (p.unloadingDistrict && p.unloadingDistrict.toLowerCase().includes(q)) ||
            (p.goodsType && p.goodsType.toLowerCase().includes(q))
          );
        });

        return (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: 20
            }}
            onClick={() => setIsDefinedLoadModalOpen(false)}
          >
            <div
              className="glass-card"
              style={{
                width: '100%',
                maxWidth: 1060,
                maxHeight: '85vh',
                background: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                border: '2px solid #93c5fd',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Başlık */}
              <div
                style={{
                  padding: '14px 20px',
                  background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Tag size={20} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>
                      Parametrelerde Tanımlı Sipariş & Sevkiyat Yükleri
                    </h3>
                    <p style={{ margin: 0, fontSize: 11, opacity: 0.9 }}>
                      {targetRowIdForDefinedLoad === 'draft'
                        ? '* Seçtiğiniz yük bilgileri en alttaki yeni satıra aktarılacaktır.'
                        : '* Seçtiğiniz yük bilgileri mevcut sefer satırına aktarılacaktır.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDefinedLoadModalOpen(false)}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    color: '#ffffff',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Arama Çubuğu */}
              <div
                style={{
                  padding: '12px 20px',
                  background: '#f8fafc',
                  borderBottom: '1.5px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 16
                }}
              >
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: 12, top: 11 }} />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Kod (sip_id), Yükün Tanımı, Firma, Yükleme veya İndirme Yeri Ara..."
                    value={definedLoadSearch}
                    onChange={e => setDefinedLoadSearch(e.target.value)}
                    autoFocus
                    style={{ paddingLeft: 36, fontSize: 13, height: 38 }}
                  />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
                  {filteredParamLoads.length} Tanımlı Yük Bulundu
                </span>
              </div>

              {/* Tanımlı Yükler Tablosu */}
              <div style={{ overflowY: 'auto', flex: 1, padding: 0 }}>
                <table className="data-table" style={{ fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#e2e8f0', color: '#1e293b', position: 'sticky', top: 0, zIndex: 2 }}>
                      <th style={{ width: 60, textAlign: 'center' }}>sip_id</th>
                      <th style={{ textAlign: 'left' }}>Yükün Tanımı</th>
                      <th style={{ textAlign: 'left' }}>Firma / Müşteri</th>
                      <th style={{ textAlign: 'left' }}>Yükleme ➔ İndirme Yeri</th>
                      <th style={{ textAlign: 'left' }}>Cinsi</th>
                      <th style={{ width: 70, textAlign: 'right' }}>Miktar</th>
                      <th style={{ width: 80, textAlign: 'right' }}>Alış Fiy.</th>
                      <th style={{ width: 80, textAlign: 'right' }}>Satış Fiy.</th>
                      <th style={{ width: 55, textAlign: 'center' }}>KDV</th>
                      <th style={{ width: 75, textAlign: 'right' }}>Komisyon</th>
                      <th style={{ width: 110, textAlign: 'center' }}>İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredParamLoads.map(p => (
                      <tr
                        key={p.id}
                        onDoubleClick={() => applyDefinedLoadToRow(targetRowIdForDefinedLoad, p)}
                        style={{ cursor: 'pointer', borderBottom: '1px solid #e2e8f0' }}
                        className="hover-row"
                        title="Seçmek için çift tıklayınız veya 'Seç & Aktar' butonuna basınız"
                      >
                        <td style={{ textAlign: 'center', fontWeight: 900, color: 'var(--diza-red)', fontFamily: 'var(--font-mono)' }}>
                          {p.sip_id}
                        </td>
                        <td>
                          <strong style={{ color: '#1e40af' }}>{p.loadTitle}</strong>
                        </td>
                        <td>
                          <strong style={{ color: '#0f172a' }}>{p.company}</strong>
                        </td>
                        <td>
                          <span style={{ color: '#047857', fontWeight: 700 }}>{p.loadingPlace}</span>
                          <span style={{ margin: '0 4px', color: '#94a3b8' }}>➔</span>
                          <span style={{ color: '#b91c1c', fontWeight: 700 }}>
                            {p.unloadingPlace} {p.unloadingDistrict ? `(${p.unloadingDistrict})` : ''}
                          </span>
                        </td>
                        <td>{p.goodsType || '-'}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>
                          {p.quantity ? `${p.quantity} Ton` : '-'}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                          {p.buyPrice ? `${Number(p.buyPrice).toFixed(2)} TL` : '-'}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#1d4ed8' }}>
                          {p.sellPrice ? `${Number(p.sellPrice).toFixed(2)} TL` : '-'}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 800, color: '#047857' }}>
                          %{p.vatRate ?? 20}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--diza-red)' }}>
                          {p.commission ? `${Number(p.commission).toLocaleString('tr-TR')} TL` : '-'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => applyDefinedLoadToRow(targetRowIdForDefinedLoad, p)}
                            style={{ padding: '4px 10px', fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <Check size={12} />
                            Seç & Aktar
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredParamLoads.length === 0 && (
                      <tr>
                        <td colSpan={11} style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
                          Aradığınız kriterlere uygun tanımlı yük bulunamadı.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Modal Alt Bar */}
              <div
                style={{
                  padding: '10px 20px',
                  background: '#f8fafc',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  * İpucu: Satıra çift tıklayarak da hızlıca aktarabilirsiniz.
                </span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsDefinedLoadModalOpen(false)}
                  style={{ padding: '6px 16px', fontWeight: 800 }}
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Firma & Cari İsimleri Otomatik Tamamlama ve Seçim Listesi (HTML Datalist) */}
      <datalist id="customer-companies-list">
        {customerNames.map((name, idx) => (
          <option key={idx} value={name}>
            {name}
          </option>
        ))}
      </datalist>
    </div>
  );
};
