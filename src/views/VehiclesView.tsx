import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { CurrencyType } from '../types';
import {
  Printer,
  X,
  Search,
  RotateCw,
  LogOut,
  Bell,
  Trash2,
  Check,
  FileText,
  Truck,
  Building,
  User,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Euro,
  Layers,
  Calendar
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/numberToWords';

export interface CariHareketRow {
  id: number;
  cariKey: string;
  kNo: number | string;
  date: string;
  description: string;
  hasReminder: boolean;
  debit: number; // Borç
  credit: number; // Alacak
  currency: CurrencyType;
  isInvoice: boolean; // fat
  isCash: boolean; // KASA
}

export const VehiclesView: React.FC = () => {
  const { vehicles, customers, setActiveTab } = useApp();

  // Birleşik Cari & Araç Listesi
  const allCariItems = useMemo(() => {
    const list: { key: string; code: string; title: string; type: 'vehicle' | 'customer'; subtitle?: string }[] = [];

    // Önce Araç & Sürücüler
    vehicles.forEach(v => {
      list.push({
        key: `V_${v.id}_${v.plate}`,
        code: `A-${v.id}`,
        title: v.plate,
        subtitle: v.driverName || 'Sürücü Atanmamış',
        type: 'vehicle'
      });
    });

    // Sonra Müşteriler & Cariler
    customers.forEach(c => {
      list.push({
        key: `C_${c.id}_${c.name}`,
        code: `C-${c.id}`,
        title: c.name,
        subtitle: c.authorizedPerson || c.city || 'Cari Müşteri',
        type: 'customer'
      });
    });

    // Eğer liste boşsa örnek kayıtlar
    if (list.length === 0) {
      list.push(
        { key: '47_aac_114', code: 'A-11', title: '47 AAC 114', subtitle: 'TURAN SERTKAYA', type: 'vehicle' },
        { key: '06_abc_47', code: 'A-12', title: '06 ABC 47', subtitle: 'ALİ GEL', type: 'vehicle' },
        { key: 'mila_cari', code: 'C-101', title: 'MİLA MİLA CARİ', subtitle: 'Kurumsal Müşteri', type: 'customer' },
        { key: '47_dksfn', code: 'A-14', title: '47 DKSFN', subtitle: 'ÇŞDÖNFLÖSDNÖM', type: 'vehicle' },
        { key: '47_ac_414', code: 'A-15', title: '47 AC 414', subtitle: 'SÖÇDMFNÖ', type: 'vehicle' },
        { key: '47_mn_5451', code: 'A-16', title: '47 MN 5451', subtitle: 'SÖMDN SD', type: 'vehicle' }
      );
    }

    return list;
  }, [vehicles, customers]);

  // Arama ve Seçili Cari
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedKey, setSelectedKey] = useState<string>(allCariItems[0]?.key || '');
  const [filterType, setFilterType] = useState<'all' | 'vehicle' | 'customer'>('all');

  useEffect(() => {
    if (!selectedKey && allCariItems.length > 0) {
      setSelectedKey(allCariItems[0].key);
    }
  }, [allCariItems, selectedKey]);

  const selectedCari = allCariItems.find(c => c.key === selectedKey) || allCariItems[0] || {
    key: '',
    code: 'C-1',
    title: 'Seçili Cari Yok',
    subtitle: '',
    type: 'customer' as const
  };

  // Filtrelenmiş Cari Listesi
  const filteredCariList = useMemo(() => {
    let res = allCariItems;
    if (filterType !== 'all') {
      res = res.filter(c => c.type === filterType);
    }
    if (!searchTerm.trim()) return res;
    const q = searchTerm.toLocaleLowerCase('tr');
    return res.filter(
      c => c.title.toLocaleLowerCase('tr').includes(q) ||
           c.subtitle?.toLocaleLowerCase('tr').includes(q) ||
           c.code.toLocaleLowerCase('tr').includes(q)
    );
  }, [allCariItems, searchTerm, filterType]);

  // Cari Hareketleri (LocalStorage Kalıcılığı)
  const [movementsMap, setMovementsMap] = useState<Record<string, CariHareketRow[]>>(() => {
    const saved = localStorage.getItem('diza_cari_movements');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      [allCariItems[0]?.key || 'default']: [
        {
          id: 1,
          cariKey: allCariItems[0]?.key || 'default',
          kNo: 1,
          date: new Date().toLocaleDateString('tr-TR'),
          description: 'Devir Bakiye Hareketi',
          hasReminder: false,
          debit: 0,
          credit: 0,
          currency: 'TL',
          isInvoice: false,
          isCash: true
        }
      ]
    };
  });

  useEffect(() => {
    localStorage.setItem('diza_cari_movements', JSON.stringify(movementsMap));
  }, [movementsMap]);

  // Seçili Carinin Hareketleri
  const currentMovements = movementsMap[selectedKey] || [];

  // Yeni Taslak Satır
  const [draftRow, setDraftRow] = useState<Partial<CariHareketRow>>({
    kNo: 'Yeni',
    date: new Date().toLocaleDateString('tr-TR'),
    description: '',
    hasReminder: false,
    debit: 0,
    credit: 0,
    currency: 'TL',
    isInvoice: false,
    isCash: false
  });

  // Ekstre Modalı
  const [isEkstreModalOpen, setIsEkstreModalOpen] = useState(false);

  // Satır Güncelleme
  const handleUpdateRow = (id: number, field: keyof CariHareketRow, value: any) => {
    setMovementsMap(prev => {
      const rows = prev[selectedKey] || [];
      const updated = rows.map(r => (r.id === id ? { ...r, [field]: value } : r));
      return { ...prev, [selectedKey]: updated };
    });
  };

  // Satır Silme
  const handleDeleteRow = (id: number) => {
    if (window.confirm('Bu cari hareketi silmek istediğinize emin misiniz?')) {
      setMovementsMap(prev => {
        const rows = prev[selectedKey] || [];
        return { ...prev, [selectedKey]: rows.filter(r => r.id !== id) };
      });
    }
  };

  // Yeni Satır Ekleme
  const handleSaveDraftRow = () => {
    if (!draftRow.description && !draftRow.debit && !draftRow.credit) {
      alert('Lütfen bir açıklama veya tutar giriniz.');
      return;
    }

    const newId = Date.now();
    const rows = movementsMap[selectedKey] || [];
    const nextKNo = rows.length + 1;

    const newRow: CariHareketRow = {
      id: newId,
      cariKey: selectedKey,
      kNo: nextKNo,
      date: draftRow.date || new Date().toLocaleDateString('tr-TR'),
      description: draftRow.description || 'Muhtelif Cari Hareket',
      hasReminder: !!draftRow.hasReminder,
      debit: Number(draftRow.debit) || 0,
      credit: Number(draftRow.credit) || 0,
      currency: (draftRow.currency as CurrencyType) || 'TL',
      isInvoice: !!draftRow.isInvoice,
      isCash: !!draftRow.isCash
    };

    setMovementsMap(prev => ({
      ...prev,
      [selectedKey]: [...(prev[selectedKey] || []), newRow]
    }));

    // Taslağı Sıfırla
    setDraftRow({
      kNo: 'Yeni',
      date: new Date().toLocaleDateString('tr-TR'),
      description: '',
      hasReminder: false,
      debit: 0,
      credit: 0,
      currency: 'TL',
      isInvoice: false,
      isCash: false
    });
  };

  // Döviz Bakiyeleri Hesaplama (Seçili Cari)
  const balances = useMemo(() => {
    let tlDebit = 0, tlCredit = 0;
    let usdDebit = 0, usdCredit = 0;
    let eurDebit = 0, eurCredit = 0;

    currentMovements.forEach(m => {
      const d = Number(m.debit) || 0;
      const c = Number(m.credit) || 0;
      if (m.currency === 'USD') {
        usdDebit += d;
        usdCredit += c;
      } else if (m.currency === 'EUR') {
        eurDebit += d;
        eurCredit += c;
      } else {
        tlDebit += d;
        tlCredit += c;
      }
    });

    return {
      TL: { debit: tlDebit, credit: tlCredit, balance: tlCredit - tlDebit },
      USD: { debit: usdDebit, credit: usdCredit, balance: usdCredit - usdDebit },
      EUR: { debit: eurDebit, credit: eurCredit, balance: eurCredit - eurDebit }
    };
  }, [currentMovements]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 1. DİZA YAZILIM ÜST KONTROL & BAKİYE PANELİ (Glass Card) */}
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
        {/* Sol Başlık & Arama Çubuğu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', margin: 0 }}>
                Cari Hareketler & Hesap Ekstresi
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
                DİZA ERP
              </span>
            </div>
            <p style={{ fontSize: 11.5, color: '#64748b', margin: '2px 0 0 0' }}>
              Araç, şoför ve müşteri cari hesap hareketleri, borç/alacak takibi
            </p>
          </div>

          {/* Hızlı Arama */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Cari / Plaka / Şoför Bul..."
              style={{
                width: 210,
                padding: '7px 10px 7px 30px',
                border: '1.5px solid #cbd5e1',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                background: '#ffffff',
                color: '#0f172a',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--diza-red)'}
              onBlur={e => e.target.style.borderColor = '#cbd5e1'}
            />
            <Search size={14} style={{ position: 'absolute', left: 9, top: 9, color: '#64748b' }} />
            {searchTerm && (
              <X
                size={13}
                onClick={() => setSearchTerm('')}
                style={{ position: 'absolute', right: 8, top: 9, color: '#94a3b8', cursor: 'pointer' }}
              />
            )}
          </div>
        </div>

        {/* Sağ: DİZA Döviz Rozetleri & Aksiyon Butonları */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Döviz Sayaçları */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {/* TL Kasa */}
            <div
              style={{
                background: '#ffffff',
                border: '1.5px solid #10b981',
                borderRadius: 6,
                padding: '4px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 1px 3px rgba(16,185,129,0.1)'
              }}
            >
              <div style={{ background: '#10b981', color: '#fff', borderRadius: 4, padding: '2px 5px', fontSize: 10, fontWeight: 900 }}>
                TL
              </div>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 900,
                  fontFamily: 'monospace',
                  color: balances.TL.balance >= 0 ? '#059669' : '#dc2626'
                }}
              >
                {balances.TL.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
              </span>
            </div>

            {/* USD Kasa */}
            <div
              style={{
                background: '#ffffff',
                border: '1.5px solid #0f172a',
                borderRadius: 6,
                padding: '4px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 1px 3px rgba(15,23,42,0.1)'
              }}
            >
              <div style={{ background: '#0f172a', color: '#fbbf24', borderRadius: 4, padding: '2px 5px', fontSize: 10, fontWeight: 900 }}>
                USD
              </div>
              <span style={{ fontSize: 13, fontWeight: 900, fontFamily: 'monospace', color: '#0f172a' }}>
                {balances.USD.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} $
              </span>
            </div>

            {/* EUR Kasa */}
            <div
              style={{
                background: '#ffffff',
                border: '1.5px solid #0284c7',
                borderRadius: 6,
                padding: '4px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 1px 3px rgba(2,132,199,0.1)'
              }}
            >
              <div style={{ background: '#0284c7', color: '#fff', borderRadius: 4, padding: '2px 5px', fontSize: 10, fontWeight: 900 }}>
                EUR
              </div>
              <span style={{ fontSize: 13, fontWeight: 900, fontFamily: 'monospace', color: '#0369a1' }}>
                {balances.EUR.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} €
              </span>
            </div>
          </div>

          {/* DİZA Aksiyon Butonları */}
          <div className="scrollable-tabs-bar" style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsEkstreModalOpen(true)}
              style={{ padding: '6px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}
            >
              <Printer size={14} /> Ekstre Hazırla
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => { setSearchTerm(''); setFilterType('all'); }}
              style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
              title="Listeyi Yenile"
            >
              <RotateCw size={13} /> Yenile
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              style={{
                background: '#f1f5f9',
                color: '#64748b',
                border: '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <LogOut size={13} /> Çıkış
            </button>
          </div>
        </div>
      </div>

      {/* 2. ANA ÇALIŞMA ALANI: SOL DİZA CARİ PANELİ + SAĞ MODERN HAREKETLER TABLOSU */}
      <div className="cari-hareketler-main-grid">
        {/* SOL PANEL: CARİ & ARAÇ LİSTESİ */}
        <div
          className="glass-card"
          style={{
            padding: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 650
          }}
        >
          {/* Liste Başlığı & Filtre Sekmeleri */}
          <div style={{ padding: '10px 12px', background: '#0f172a', color: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <strong style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Layers size={14} color="var(--diza-red)" /> Cari & Araç Portföyü
              </strong>
              <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.2)', padding: '1px 6px', borderRadius: 10 }}>
                {filteredCariList.length} Kayıt
              </span>
            </div>

            {/* Tür Filtresi (Tümü / Araçlar / Müşteriler) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, marginBottom: 8 }}>
              <button
                type="button"
                onClick={() => setFilterType('all')}
                style={{
                  background: filterType === 'all' ? 'var(--diza-red)' : 'rgba(255,255,255,0.1)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 4,
                  padding: '4px 0',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Tümü
              </button>
              <button
                type="button"
                onClick={() => setFilterType('vehicle')}
                style={{
                  background: filterType === 'vehicle' ? 'var(--diza-red)' : 'rgba(255,255,255,0.1)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 4,
                  padding: '4px 0',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Araçlar
              </button>
              <button
                type="button"
                onClick={() => setFilterType('customer')}
                style={{
                  background: filterType === 'customer' ? 'var(--diza-red)' : 'rgba(255,255,255,0.1)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 4,
                  padding: '4px 0',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Cariler
              </button>
            </div>

            {/* Sol Panel İçi Arama Kutusu */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Plaka, Şoför veya Cari Ara..."
                style={{
                  width: '100%',
                  padding: '6px 26px 6px 28px',
                  border: '1px solid rgba(255,255,255,0.25)',
                  borderRadius: 5,
                  fontSize: 11.5,
                  fontWeight: 600,
                  background: 'rgba(255,255,255,0.15)',
                  color: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <Search size={13} style={{ position: 'absolute', left: 8, top: 8, color: '#94a3b8' }} />
              {searchTerm && (
                <X
                  size={13}
                  onClick={() => setSearchTerm('')}
                  style={{ position: 'absolute', right: 8, top: 8, color: '#ffffff', cursor: 'pointer' }}
                />
              )}
            </div>
          </div>

          {/* Dikey Kaydırılabilir Cari Listesi */}
          <div style={{ overflowY: 'auto', flex: 1, maxHeight: 570, background: '#ffffff' }}>
            {filteredCariList.map(item => {
              const isSelected = item.key === selectedKey;
              return (
                <div
                  key={item.key}
                  onClick={() => setSelectedKey(item.key)}
                  style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid #f1f5f9',
                    cursor: 'pointer',
                    background: isSelected
                      ? 'linear-gradient(135deg, rgba(225,29,72,0.08) 0%, rgba(225,29,72,0.02) 100%)'
                      : 'transparent',
                    borderLeft: isSelected ? '4px solid var(--diza-red)' : '4px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) e.currentTarget.style.background = '#f8fafc';
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        background: isSelected
                          ? 'var(--diza-red)'
                          : item.type === 'vehicle' ? '#eff6ff' : '#f0fdf4',
                        color: isSelected
                          ? '#ffffff'
                          : item.type === 'vehicle' ? '#2563eb' : '#16a34a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 900,
                        flexShrink: 0
                      }}
                    >
                      {item.type === 'vehicle' ? <Truck size={14} /> : <Building size={14} />}
                    </div>

                    <div style={{ overflow: 'hidden' }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: isSelected ? 900 : 700,
                          color: isSelected ? 'var(--diza-red)' : '#0f172a',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {item.title}
                      </div>
                      <div
                        style={{
                          fontSize: 10.5,
                          color: '#64748b',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      color: isSelected ? 'var(--diza-red)' : '#94a3b8',
                      background: isSelected ? '#ffe4e6' : '#f1f5f9',
                      padding: '1px 5px',
                      borderRadius: 4,
                      flexShrink: 0
                    }}
                  >
                    {item.code}
                  </span>
                </div>
              );
            })}

            {filteredCariList.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                Kriterlere uygun kayıt bulunamadı.
              </div>
            )}
          </div>
        </div>

        {/* SAĞ PANEL: SEÇİLİ CARİ DETAYI + HAREKETLER TABLOSU */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Seçili Cari Başlık Kartı (DİZA Tasarımı) */}
          <div
            className="glass-card"
            style={{
              padding: '10px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#0f172a',
              color: '#ffffff',
              borderRadius: 8
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  background: 'var(--diza-red)',
                  color: '#ffffff',
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontWeight: 900,
                  fontSize: 13,
                  fontFamily: 'monospace'
                }}
              >
                {selectedCari.code}
              </div>

              <div>
                <h4 style={{ fontSize: 14, fontWeight: 900, margin: 0, color: '#ffffff' }}>
                  {selectedCari.title}
                </h4>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0 0' }}>
                  {selectedCari.subtitle} • {currentMovements.length} Adet Cari Hareket Kaydı
                </p>
              </div>
            </div>

            {/* Bakiye Özeti Rozeti */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10.5, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800 }}>
                Net Cari Bakiye
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 900,
                  fontFamily: 'monospace',
                  color: balances.TL.balance >= 0 ? '#10b981' : '#f43f5e'
                }}
              >
                {balances.TL.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
              </div>
            </div>
          </div>

          {/* DİZA Kurumsal Hareketler Tablosu */}
          <div
            className="glass-card"
            style={{
              padding: 0,
              overflow: 'hidden',
              borderRadius: 8
            }}
          >
            {/* Masaüstü Tablosu */}
            <div className="desktop-only-table" style={{ overflowX: 'auto', maxHeight: 520 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
                {/* DİZA Tablo Başlığı */}
                <thead>
                  <tr
                    style={{
                      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                      color: '#ffffff',
                      fontWeight: 800
                    }}
                  >
                    <th style={{ width: 45, padding: '8px 6px', textAlign: 'center', borderRight: '1px solid #334155' }}>K.No</th>
                    <th style={{ width: 95, padding: '8px 6px', textAlign: 'center', borderRight: '1px solid #334155' }}>Tarih</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', borderRight: '1px solid #334155' }}>Açıklama</th>
                    <th style={{ width: 40, padding: '8px 4px', textAlign: 'center', borderRight: '1px solid #334155' }} title="Vade / Hatırlatıcı">🔔</th>
                    <th style={{ width: 105, padding: '8px 8px', textAlign: 'right', borderRight: '1px solid #334155', color: '#fca5a5' }}>BORÇ</th>
                    <th style={{ width: 105, padding: '8px 8px', textAlign: 'right', borderRight: '1px solid #334155', color: '#86efac' }}>ALACAK</th>
                    <th style={{ width: 70, padding: '8px 6px', textAlign: 'center', borderRight: '1px solid #334155' }}>Döviz</th>
                    <th style={{ width: 45, padding: '8px 4px', textAlign: 'center', borderRight: '1px solid #334155' }}>Fat.</th>
                    <th style={{ width: 50, padding: '8px 4px', textAlign: 'center', borderRight: '1px solid #334155' }}>Kasa</th>
                    <th style={{ width: 40, padding: '8px 4px', textAlign: 'center' }}>Sil</th>
                  </tr>
                </thead>

                <tbody>
                  {/* MEVCUT SATIRLAR */}
                  {currentMovements.map((m, idx) => (
                    <tr
                      key={m.id}
                      style={{
                        borderBottom: '1px solid #e2e8f0',
                        background: idx % 2 === 1 ? '#f8fafc' : '#ffffff',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                      onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 1 ? '#f8fafc' : '#ffffff'}
                    >
                      {/* K.No */}
                      <td style={{ padding: '4px 6px', textAlign: 'center', borderRight: '1px solid #e2e8f0', fontWeight: 800, color: '#64748b' }}>
                        {m.kNo || idx + 1}
                      </td>

                      {/* Tarih */}
                      <td style={{ padding: '3px 4px', borderRight: '1px solid #e2e8f0' }}>
                        <input
                          type="text"
                          value={m.date}
                          onChange={e => handleUpdateRow(m.id, 'date', e.target.value)}
                          style={{ width: '100%', padding: '3px 4px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 11, textAlign: 'center', background: '#ffffff' }}
                        />
                      </td>

                      {/* Açıklama */}
                      <td style={{ padding: '3px 6px', borderRight: '1px solid #e2e8f0' }}>
                        <input
                          type="text"
                          value={m.description}
                          onChange={e => handleUpdateRow(m.id, 'description', e.target.value)}
                          style={{ width: '100%', padding: '3px 6px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 11.5, fontWeight: 700, color: '#0f172a', background: '#ffffff' }}
                        />
                      </td>

                      {/* Hatırlatıcı */}
                      <td style={{ padding: '3px 4px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>
                        <button
                          type="button"
                          onClick={() => handleUpdateRow(m.id, 'hasReminder', !m.hasReminder)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: m.hasReminder ? '#f59e0b' : '#cbd5e1',
                            padding: 2
                          }}
                          title={m.hasReminder ? 'Hatırlatıcı Aktif' : 'Hatırlatıcı Ekle'}
                        >
                          <Bell size={14} />
                        </button>
                      </td>

                      {/* BORÇ */}
                      <td style={{ padding: '3px 4px', borderRight: '1px solid #e2e8f0' }}>
                        <input
                          type="number"
                          step="0.01"
                          value={m.debit || ''}
                          onChange={e => handleUpdateRow(m.id, 'debit', Number(e.target.value))}
                          placeholder="0,00"
                          style={{
                            width: '100%',
                            padding: '3px 6px',
                            border: '1px solid #fca5a5',
                            borderRadius: 4,
                            fontSize: 11.5,
                            textAlign: 'right',
                            fontFamily: 'monospace',
                            color: '#dc2626',
                            fontWeight: 800,
                            background: '#fff'
                          }}
                        />
                      </td>

                      {/* ALACAK */}
                      <td style={{ padding: '3px 4px', borderRight: '1px solid #e2e8f0' }}>
                        <input
                          type="number"
                          step="0.01"
                          value={m.credit || ''}
                          onChange={e => handleUpdateRow(m.id, 'credit', Number(e.target.value))}
                          placeholder="0,00"
                          style={{
                            width: '100%',
                            padding: '3px 6px',
                            border: '1px solid #86efac',
                            borderRadius: 4,
                            fontSize: 11.5,
                            textAlign: 'right',
                            fontFamily: 'monospace',
                            color: '#16a34a',
                            fontWeight: 800,
                            background: '#fff'
                          }}
                        />
                      </td>

                      {/* Para Cinsi */}
                      <td style={{ padding: '3px 4px', borderRight: '1px solid #e2e8f0' }}>
                        <select
                          value={m.currency}
                          onChange={e => handleUpdateRow(m.id, 'currency', e.target.value as CurrencyType)}
                          style={{ width: '100%', padding: '3px 2px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 11, fontWeight: 800, background: '#ffffff' }}
                        >
                          <option value="TL">TL</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                        </select>
                      </td>

                      {/* Fatura */}
                      <td style={{ padding: '3px 4px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>
                        <input
                          type="checkbox"
                          checked={m.isInvoice}
                          onChange={e => handleUpdateRow(m.id, 'isInvoice', e.target.checked)}
                          style={{ cursor: 'pointer', width: 14, height: 14 }}
                        />
                      </td>

                      {/* Kasa */}
                      <td style={{ padding: '3px 4px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>
                        <input
                          type="checkbox"
                          checked={m.isCash}
                          onChange={e => handleUpdateRow(m.id, 'isCash', e.target.checked)}
                          style={{ cursor: 'pointer', width: 14, height: 14 }}
                        />
                      </td>

                      {/* Sil */}
                      <td style={{ padding: '3px 4px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(m.id)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}
                          title="Satırı Sil"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* DİZA DAİMİ YENİ KAYIT SATIRI (Pembe/Kırmızı Vurgulu) */}
                  <tr style={{ background: '#fff1f2', borderTop: '2px dashed var(--diza-red)' }}>
                    {/* K.No: Yeni */}
                    <td style={{ padding: '4px 6px', textAlign: 'center', borderRight: '1px solid #fecdd3', fontWeight: 900, color: 'var(--diza-red)', fontSize: 11.5 }}>
                      ▶ Yeni
                    </td>

                    {/* Tarih */}
                    <td style={{ padding: '3px 4px', borderRight: '1px solid #fecdd3' }}>
                      <input
                        type="text"
                        value={draftRow.date || ''}
                        onChange={e => setDraftRow(prev => ({ ...prev, date: e.target.value }))}
                        style={{ width: '100%', padding: '3px 4px', border: '1.5px solid var(--diza-red)', borderRadius: 4, fontSize: 11, textAlign: 'center', background: '#ffffff' }}
                      />
                    </td>

                    {/* Açıklama */}
                    <td style={{ padding: '3px 6px', borderRight: '1px solid #fecdd3' }}>
                      <input
                        type="text"
                        value={draftRow.description || ''}
                        onChange={e => setDraftRow(prev => ({ ...prev, description: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveDraftRow(); }}
                        placeholder="Yeni Hareket Açıklaması Yazınız..."
                        style={{ width: '100%', padding: '3px 8px', border: '1.5px solid var(--diza-red)', borderRadius: 4, fontSize: 11.5, fontWeight: 700, background: '#ffffff' }}
                      />
                    </td>

                    {/* Hatırlatıcı */}
                    <td style={{ padding: '3px 4px', textAlign: 'center', borderRight: '1px solid #fecdd3' }}>
                      <button
                        type="button"
                        onClick={() => setDraftRow(prev => ({ ...prev, hasReminder: !prev.hasReminder }))}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: draftRow.hasReminder ? '#f59e0b' : '#94a3b8',
                          padding: 2
                        }}
                      >
                        <Bell size={14} />
                      </button>
                    </td>

                    {/* BORÇ */}
                    <td style={{ padding: '3px 4px', borderRight: '1px solid #fecdd3' }}>
                      <input
                        type="number"
                        step="0.01"
                        value={draftRow.debit !== undefined && draftRow.debit !== 0 ? draftRow.debit : ''}
                        onChange={e => setDraftRow(prev => ({ ...prev, debit: Number(e.target.value) }))}
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveDraftRow(); }}
                        placeholder="0,00"
                        style={{
                          width: '100%',
                          padding: '3px 6px',
                          border: '1.5px solid var(--diza-red)',
                          borderRadius: 4,
                          fontSize: 11.5,
                          textAlign: 'right',
                          fontFamily: 'monospace',
                          color: '#dc2626',
                          fontWeight: 900,
                          background: '#ffffff'
                        }}
                      />
                    </td>

                    {/* ALACAK */}
                    <td style={{ padding: '3px 4px', borderRight: '1px solid #fecdd3' }}>
                      <input
                        type="number"
                        step="0.01"
                        value={draftRow.credit !== undefined && draftRow.credit !== 0 ? draftRow.credit : ''}
                        onChange={e => setDraftRow(prev => ({ ...prev, credit: Number(e.target.value) }))}
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveDraftRow(); }}
                        placeholder="0,00"
                        style={{
                          width: '100%',
                          padding: '3px 6px',
                          border: '1.5px solid var(--diza-red)',
                          borderRadius: 4,
                          fontSize: 11.5,
                          textAlign: 'right',
                          fontFamily: 'monospace',
                          color: '#16a34a',
                          fontWeight: 900,
                          background: '#ffffff'
                        }}
                      />
                    </td>

                    {/* Para Cinsi */}
                    <td style={{ padding: '3px 4px', borderRight: '1px solid #fecdd3' }}>
                      <select
                        value={draftRow.currency || 'TL'}
                        onChange={e => setDraftRow(prev => ({ ...prev, currency: e.target.value as CurrencyType }))}
                        style={{ width: '100%', padding: '3px 2px', border: '1.5px solid var(--diza-red)', borderRadius: 4, fontSize: 11, fontWeight: 800, background: '#ffffff' }}
                      >
                        <option value="TL">TL</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                      </select>
                    </td>

                    {/* Fatura */}
                    <td style={{ padding: '3px 4px', textAlign: 'center', borderRight: '1px solid #fecdd3' }}>
                      <input
                        type="checkbox"
                        checked={!!draftRow.isInvoice}
                        onChange={e => setDraftRow(prev => ({ ...prev, isInvoice: e.target.checked }))}
                        style={{ cursor: 'pointer', width: 14, height: 14 }}
                      />
                    </td>

                    {/* Kasa */}
                    <td style={{ padding: '3px 4px', textAlign: 'center', borderRight: '1px solid #fecdd3' }}>
                      <input
                        type="checkbox"
                        checked={!!draftRow.isCash}
                        onChange={e => setDraftRow(prev => ({ ...prev, isCash: e.target.checked }))}
                        style={{ cursor: 'pointer', width: 14, height: 14 }}
                      />
                    </td>

                    {/* Ekle Butonu */}
                    <td style={{ padding: '3px 4px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={handleSaveDraftRow}
                        className="btn btn-primary"
                        style={{
                          padding: '4px 8px',
                          fontSize: 11,
                          borderRadius: 4,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Yeni Hareketi Kaydet"
                      >
                        <Plus size={13} />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Mobilde Dokunmatik Cari Hareket Kartları */}
            <div className="mobile-only-cards" style={{ padding: '12px' }}>
              {currentMovements.map((m, idx) => {
                const hasDebit = Number(m.debit) > 0;
                const hasCredit = Number(m.credit) > 0;

                return (
                  <div
                    key={m.id}
                    className="mobile-action-card"
                    style={{
                      borderLeft: hasDebit ? '4px solid #ef4444' : hasCredit ? '4px solid #10b981' : '4px solid #94a3b8'
                    }}
                  >
                    <div className="card-top-row">
                      <span style={{ fontWeight: 800, color: '#64748b', fontSize: 11 }}>
                        K.No: #{m.kNo || idx + 1}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="card-date-tag">{m.date}</span>
                        {m.hasReminder && (
                          <span title="Hatırlatıcı Aktif" style={{ color: '#f59e0b', fontSize: 12 }}>🔔</span>
                        )}
                      </div>
                    </div>

                    <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a', margin: '3px 0' }}>
                      {m.description || 'Açıklama Belirtilmemiş'}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', margin: '2px 0' }}>
                      <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontSize: 10.5, fontWeight: 800, color: '#334155' }}>
                        {m.currency}
                      </span>
                      {m.isInvoice && (
                        <span style={{ background: 'rgba(59,130,246,0.1)', color: '#2563eb', padding: '2px 6px', borderRadius: 4, fontSize: 10.5, fontWeight: 800 }}>
                          ✓ Fatura
                        </span>
                      )}
                      {m.isCash && (
                        <span style={{ background: 'rgba(16,185,129,0.1)', color: '#059669', padding: '2px 6px', borderRadius: 4, fontSize: 10.5, fontWeight: 800 }}>
                          Kasa
                        </span>
                      )}
                    </div>

                    <div className="card-bottom-row" style={{ marginTop: 4 }}>
                      <div>
                        {hasDebit && (
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                            <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 800 }}>BORÇ:</span>
                            <strong style={{ fontSize: 15, fontFamily: 'monospace', color: '#dc2626' }}>
                              {Number(m.debit).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {m.currency}
                            </strong>
                          </div>
                        )}
                        {hasCredit && (
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                            <span style={{ fontSize: 11, color: '#059669', fontWeight: 800 }}>ALACAK:</span>
                            <strong style={{ fontSize: 15, fontFamily: 'monospace', color: '#059669' }}>
                              {Number(m.credit).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {m.currency}
                            </strong>
                          </div>
                        )}
                        {!hasDebit && !hasCredit && (
                          <span style={{ fontSize: 12, color: '#94a3b8' }}>0,00 {m.currency}</span>
                        )}
                      </div>

                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteRow(m.id)}
                        style={{ padding: '4px 8px', fontSize: 11 }}
                        title="Hareketi Sil"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Mobilde Hızlı Yeni Hareket Ekleme Kutusu */}
              <div
                className="mobile-action-card"
                style={{
                  background: '#fef2f2',
                  border: '1.5px dashed var(--diza-red)',
                  padding: 12
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--diza-red)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Plus size={14} /> Bu Cari İçin Hızlı Yeni Hareket Ekle
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="Hareket Açıklaması (Örn: Mazot Masrafı, Sefer Avansı)..."
                    value={draftRow.description}
                    onChange={e => setDraftRow(prev => ({ ...prev, description: e.target.value }))}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      fontSize: 13,
                      fontWeight: 700
                    }}
                  />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                      <label style={{ fontSize: 10.5, fontWeight: 800, color: '#dc2626' }}>Borç Tutarı</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={draftRow.debit !== undefined && draftRow.debit !== 0 ? draftRow.debit : ''}
                        onChange={e => setDraftRow(prev => ({ ...prev, debit: Number(e.target.value) }))}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: 6,
                          border: '1px solid #cbd5e1',
                          fontSize: 13,
                          fontWeight: 800,
                          fontFamily: 'monospace',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 10.5, fontWeight: 800, color: '#059669' }}>Alacak Tutarı</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={draftRow.credit !== undefined && draftRow.credit !== 0 ? draftRow.credit : ''}
                        onChange={e => setDraftRow(prev => ({ ...prev, credit: Number(e.target.value) }))}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: 6,
                          border: '1px solid #cbd5e1',
                          fontSize: 13,
                          fontWeight: 800,
                          fontFamily: 'monospace',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSaveDraftRow}
                    style={{
                      padding: '9px',
                      fontSize: 13,
                      fontWeight: 900,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    <Plus size={16} /> Hareketi Kaydet
                  </button>
                </div>
              </div>
            </div>

            {/* Tablo Alt Toplam Özeti (DİZA Ribbon) */}
            <div
              style={{
                padding: '8px 16px',
                background: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: 20,
                fontSize: 12
              }}
            >
              <div>
                <span style={{ color: '#64748b', marginRight: 6 }}>Toplam Borç:</span>
                <strong style={{ color: '#dc2626', fontFamily: 'monospace', fontSize: 13 }}>
                  {balances.TL.debit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                </strong>
              </div>

              <div>
                <span style={{ color: '#64748b', marginRight: 6 }}>Toplam Alacak:</span>
                <strong style={{ color: '#16a34a', fontFamily: 'monospace', fontSize: 13 }}>
                  {balances.TL.credit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                </strong>
              </div>

              <div style={{ paddingLeft: 12, borderLeft: '2px solid #cbd5e1' }}>
                <span style={{ color: '#0f172a', fontWeight: 800, marginRight: 6 }}>Kalan Bakiye:</span>
                <strong
                  style={{
                    color: balances.TL.balance >= 0 ? '#10b981' : '#f43f5e',
                    fontFamily: 'monospace',
                    fontSize: 14,
                    fontWeight: 900
                  }}
                >
                  {balances.TL.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. DİZA RESMİ CARİ HESAP EKSTRESİ MODALI */}
      {isEkstreModalOpen && (
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
              width: 820,
              maxWidth: '95vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
              padding: 0,
              overflow: 'hidden'
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: 'var(--diza-red)', padding: 6, borderRadius: 6, display: 'flex' }}>
                  <FileText size={18} color="#ffffff" />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 900, margin: 0, color: '#ffffff' }}>
                    Resmi Cari Hesap Ekstresi
                  </h3>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                    {selectedCari.title} ({selectedCari.code})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEkstreModalOpen(false)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#ffffff', cursor: 'pointer', borderRadius: 4, padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Ekstre Rapor Gövdesi */}
            <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
              {/* Şirket Logo & Rapor Anteti */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--diza-red)', paddingBottom: 14, marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 900, color: '#0f172a', margin: 0 }}>
                    GÖRDİT BİLGİSAYAR VE TAŞIMACILIK LTD. ŞTİ.
                  </h2>
                  <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--diza-red)', margin: '2px 0 0 0' }}>
                    DİZA LOJİSTİK & FİLO YÖNETİMİ
                  </p>
                  <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0 0' }}>
                    Tel: 0(324) 233 00 00 • Mersin • Zafer GÖRGÜN
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      background: 'rgba(225, 29, 72, 0.1)',
                      color: 'var(--diza-red)',
                      border: '1px solid var(--diza-red)',
                      padding: '4px 10px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 900
                    }}
                  >
                    HESAP EKSTRESİ
                  </span>
                  <p style={{ fontSize: 11, color: '#64748b', margin: '6px 0 0 0' }}>
                    Tarih: {new Date().toLocaleDateString('tr-TR')}
                  </p>
                </div>
              </div>

              {/* Cari Müşteri Bilgileri */}
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 6, marginBottom: 16, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong style={{ fontSize: 13, color: '#0f172a' }}>Sayın: {selectedCari.title}</strong>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{selectedCari.subtitle}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Cari / Araç Referansı:</span>
                  <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--diza-red)', fontFamily: 'monospace' }}>{selectedCari.code}</div>
                </div>
              </div>

              {/* Ekstre Tablosu */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, marginBottom: 16 }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                    <th style={{ padding: '7px 10px', textAlign: 'left' }}>Tarih</th>
                    <th style={{ padding: '7px 10px', textAlign: 'left' }}>Hareket Açıklaması</th>
                    <th style={{ padding: '7px 10px', textAlign: 'right', color: '#dc2626' }}>Borç</th>
                    <th style={{ padding: '7px 10px', textAlign: 'right', color: '#16a34a' }}>Alacak</th>
                    <th style={{ padding: '7px 10px', textAlign: 'center' }}>Döviz</th>
                    <th style={{ padding: '7px 10px', textAlign: 'center' }}>Fatura</th>
                  </tr>
                </thead>
                <tbody>
                  {currentMovements.map(m => (
                    <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '7px 10px' }}>{m.date}</td>
                      <td style={{ padding: '7px 10px', fontWeight: 700, color: '#0f172a' }}>{m.description}</td>
                      <td style={{ padding: '7px 10px', textAlign: 'right', color: '#dc2626', fontFamily: 'monospace', fontWeight: 700 }}>
                        {m.debit ? Number(m.debit).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : '-'}
                      </td>
                      <td style={{ padding: '7px 10px', textAlign: 'right', color: '#16a34a', fontFamily: 'monospace', fontWeight: 700 }}>
                        {m.credit ? Number(m.credit).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : '-'}
                      </td>
                      <td style={{ padding: '7px 10px', textAlign: 'center', fontWeight: 800 }}>{m.currency}</td>
                      <td style={{ padding: '7px 10px', textAlign: 'center' }}>{m.isInvoice ? '✓' : '-'}</td>
                    </tr>
                  ))}
                  {currentMovements.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
                        Bu cariye ait henüz bir hareket kaydı bulunmuyor.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Bakiye Özeti Paneli */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ textAlign: 'center', padding: '6px 0', borderRight: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>TL BAKİYE</div>
                  <strong style={{ fontSize: 16, fontFamily: 'monospace', color: balances.TL.balance >= 0 ? '#10b981' : '#dc2626' }}>
                    {balances.TL.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                  </strong>
                </div>

                <div style={{ textAlign: 'center', padding: '6px 0', borderRight: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>USD BAKİYE</div>
                  <strong style={{ fontSize: 16, fontFamily: 'monospace', color: '#0f172a' }}>
                    {balances.USD.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} $
                  </strong>
                </div>

                <div style={{ textAlign: 'center', padding: '6px 0' }}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>EUR BAKİYE</div>
                  <strong style={{ fontSize: 16, fontFamily: 'monospace', color: '#0284c7' }}>
                    {balances.EUR.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} €
                  </strong>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '12px 20px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f8fafc'
              }}
            >
              <div style={{ fontSize: 11, color: '#64748b' }}>
                Gördit Bilgisayar — Zafer GÖRGÜN © 2026
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn btn-primary"
                  style={{ padding: '6px 16px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Printer size={14} /> Yazdır / PDF İndir
                </button>
                <button
                  type="button"
                  onClick={() => setIsEkstreModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ padding: '6px 14px', fontSize: 12 }}
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
