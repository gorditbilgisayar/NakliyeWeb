import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Wallet,
  Truck,
  Package,
  FileText,
  Clock,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Building,
  Users,
  Layers,
  ChevronRight,
  Calendar,
  Activity,
  DollarSign,
  ShieldCheck,
  Send,
  Printer,
  Sparkles
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/numberToWords';

export const DashboardView: React.FC<{
  onOpenNewShipment: () => void;
  onOpenNewCash: () => void;
  onOpenNewInvoice: () => void;
}> = ({ onOpenNewShipment, onOpenNewCash, onOpenNewInvoice }) => {
  const {
    shipments,
    vehicles,
    customers,
    cashEntries,
    invoices,
    reminders,
    getCashBalance,
    setActiveTab,
    completeShipment
  } = useApp();

  // Kasa Bakiyeleri
  const cashTL = getCashBalance('TL');
  const cashUSD = getCashBalance('USD');
  const cashEUR = getCashBalance('EUR');

  // Operasyonel İstatistikler
  const pendingShipments = shipments.filter(s => s.status === 'SIPARIS');
  const onTheRoadShipments = shipments.filter(s => s.status === 'YOLDA');
  const completedShipments = shipments.filter(s => s.status === 'TESLIM_EDILDI' || s.status === 'FATURALANDI');
  const activeVehicles = vehicles.filter(v => v.isActive);
  const pendingReminders = reminders.filter(r => r.status === 'BEKLIYOR');

  // Toplam Taşınan Tonaj
  const totalTonnage = useMemo(() => {
    return shipments.reduce((acc, s) => acc + (Number(s.quantity) || 0), 0);
  }, [shipments]);

  // Toplam Sefer Cirosu
  const totalFreightRevenue = useMemo(() => {
    return shipments.reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0);
  }, [shipments]);

  // Toplam Fatura Tutarı
  const totalInvoiceAmount = useMemo(() => {
    return invoices.reduce((acc, inv) => acc + (Number(inv.grandTotal) || 0), 0);
  }, [invoices]);

  // Yük Cinslerine Göre Dağılım
  const goodsDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    shipments.forEach(s => {
      const type = s.goodsType || 'Muhtelif';
      counts[type] = (counts[type] || 0) + (Number(s.quantity) || 1);
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [shipments]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, fontFamily: 'Segoe UI, Tahoma, sans-serif' }}>
      {/* 1. ÜST HOŞGELDİNİZ & DİZA DURUM BANDI */}
      <div className="glass-card dashboard-hero-banner">
        <div className="dashboard-hero-left">
          <div className="dashboard-logo-badge">
            D
          </div>
          <div className="dashboard-hero-text">
            <div className="dashboard-hero-title-row">
              <h2>DİZA LOJİSTİK & FİLO ERP</h2>
              <span className="dashboard-version-badge">
                Gördit Bilgisayar v2.5.5
              </span>
            </div>
            <p>
              Zafer GÖRGÜN • Canlı Lojistik ve Finansal Operasyon Merkezi
            </p>
          </div>
        </div>

        <div className="dashboard-hero-right">
          <div className="dashboard-status-chip">
            <div className="chip-label">Sistem Durumu</div>
            <div className="chip-value online">
              <span className="status-dot"></span>
              Tüm Modüller Çevrimiçi
            </div>
          </div>

          <div className="dashboard-status-chip">
            <div className="chip-label">Tarih & Saat</div>
            <div className="chip-value mono">
              {new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      {/* 2. ANA FİNANSAL & OPERASYONEL KPI KARTLARI (6 Kolonlu Izgara) */}
      <div className="dashboard-kpi-grid">
        {/* 1. TL Kasa */}
        <div
          className="glass-card"
          onClick={() => setActiveTab('cashbook')}
          style={{ cursor: 'pointer', borderLeft: '4px solid #10b981', transition: 'transform 0.15s' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>
                TL KASA MEVCUDU
              </span>
              <h3 style={{ fontSize: 20, fontWeight: 900, color: cashTL >= 0 ? '#059669' : '#dc2626', margin: '4px 0 0 0', fontFamily: 'monospace' }}>
                {formatCurrency(cashTL, 'TL')}
              </h3>
            </div>
            <div style={{ background: '#ecfdf5', padding: 8, borderRadius: 8, color: '#059669' }}>
              <Wallet size={18} />
            </div>
          </div>
          <div style={{ marginTop: 8, display: 'flex', gap: 8, fontSize: 11, color: '#64748b' }}>
            <span>USD: <strong style={{ color: '#0f172a' }}>${cashUSD.toLocaleString('tr-TR')}</strong></span>
            <span>EUR: <strong style={{ color: '#0f172a' }}>€{cashEUR.toLocaleString('tr-TR')}</strong></span>
          </div>
        </div>

        {/* 2. Yoldaki Seferler */}
        <div
          className="glass-card"
          onClick={() => setActiveTab('shipments')}
          style={{ cursor: 'pointer', borderLeft: '4px solid #2563eb', transition: 'transform 0.15s' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>
                YOLDAKİ SEFERLER
              </span>
              <h3 style={{ fontSize: 20, fontWeight: 900, color: '#1d4ed8', margin: '4px 0 0 0' }}>
                {onTheRoadShipments.length} <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Araç Yolda</span>
              </h3>
            </div>
            <div style={{ background: '#eff6ff', padding: 8, borderRadius: 8, color: '#2563eb' }}>
              <Truck size={18} />
            </div>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: '#64748b' }}>
            Toplam <strong>{activeVehicles.length}</strong> kayıtlı araç sahada aktif.
          </div>
        </div>

        {/* 3. Bekleyen Siparişler */}
        <div
          className="glass-card"
          onClick={() => setActiveTab('shipments')}
          style={{ cursor: 'pointer', borderLeft: '4px solid #f59e0b', transition: 'transform 0.15s' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>
                AÇIK YÜK SİPARİŞLERİ
              </span>
              <h3 style={{ fontSize: 20, fontWeight: 900, color: '#b45309', margin: '4px 0 0 0' }}>
                {pendingShipments.length} <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Sevkiyat</span>
              </h3>
            </div>
            <div style={{ background: '#fffbeb', padding: 8, borderRadius: 8, color: '#d97706' }}>
              <Package size={18} />
            </div>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: '#64748b' }}>
            Araç ataması ve çıkış bekleyen yükler.
          </div>
        </div>

        {/* 4. Toplam Taşınan Hacim */}
        <div
          className="glass-card"
          onClick={() => setActiveTab('vehicle_registration')}
          style={{ cursor: 'pointer', borderLeft: '4px solid var(--diza-red)', transition: 'transform 0.15s' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>
                TOPLAM TAŞINAN TONAJ
              </span>
              <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--diza-red)', margin: '4px 0 0 0' }}>
                {totalTonnage.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Ton</span>
              </h3>
            </div>
            <div style={{ background: 'rgba(225,29,72,0.1)', padding: 8, borderRadius: 8, color: 'var(--diza-red)' }}>
              <Activity size={18} />
            </div>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: '#64748b' }}>
            {completedShipments.length} tamamlanan sefer hacmi.
          </div>
        </div>

        {/* 5. Fatura & Tevkifat */}
        <div
          className="glass-card"
          onClick={() => setActiveTab('invoices')}
          style={{ cursor: 'pointer', borderLeft: '4px solid #8b5cf6', transition: 'transform 0.15s' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>
                FATURA & TEVKİFAT
              </span>
              <h3 style={{ fontSize: 20, fontWeight: 900, color: '#6d28d9', margin: '4px 0 0 0', fontFamily: 'monospace' }}>
                {formatCurrency(totalInvoiceAmount, 'TL')}
              </h3>
            </div>
            <div style={{ background: '#f5f3ff', padding: 8, borderRadius: 8, color: '#8b5cf6' }}>
              <FileText size={18} />
            </div>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: '#64748b' }}>
            {invoices.length} adet resmi e-fatura / tevkifat.
          </div>
        </div>

        {/* 6. Vadeli Çek / Senet */}
        <div
          className="glass-card"
          onClick={() => setActiveTab('reminders')}
          style={{ cursor: 'pointer', borderLeft: '4px solid #ec4899', transition: 'transform 0.15s' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>
                VADELİ ÇEK / SENET
              </span>
              <h3 style={{ fontSize: 20, fontWeight: 900, color: '#be185d', margin: '4px 0 0 0' }}>
                {pendingReminders.length} <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Evrak</span>
              </h3>
            </div>
            <div style={{ background: '#fdf2f8', padding: 8, borderRadius: 8, color: '#ec4899' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: '#64748b' }}>
            Takipte bekleyen vadeli ödeme/tahsilat.
          </div>
        </div>
      </div>



      {/* 4. CANLI OPERASYON MASASI (2 BÖLÜM: YOLDAKİ SEFERLER + SON KASA & CARİ HAREKETLERİ) */}
      <div className="dashboard-split-grid">
        {/* SOL: Yoldaki Aktif Seferler & Hızlı Tamamlama */}
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden', borderRadius: 8 }}>
          <div
            style={{
              padding: '10px 14px',
              background: '#0f172a',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Truck size={16} color="#38bdf8" />
              <strong style={{ fontSize: 13 }}>Yoldaki Aktif Seferler & Sevkiyat Masası</strong>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('shipments')}
              style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
            >
              Tümünü Gör <ChevronRight size={13} />
            </button>
          </div>

          {/* Masaüstü Tablo Görünümü */}
          <div className="desktop-only-table" style={{ overflowX: 'auto', maxHeight: 330, background: '#ffffff' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#475569', fontWeight: 800 }}>
                  <th style={{ padding: '7px 8px', textAlign: 'left' }}>Sefer No</th>
                  <th style={{ padding: '7px 8px', textAlign: 'left' }}>Plaka / Sürücü</th>
                  <th style={{ padding: '7px 8px', textAlign: 'left' }}>Müşteri</th>
                  <th style={{ padding: '7px 8px', textAlign: 'left' }}>Güzergah</th>
                  <th style={{ padding: '7px 8px', textAlign: 'left' }}>Cinsi</th>
                  <th style={{ padding: '7px 8px', textAlign: 'right' }}>Navlun</th>
                  <th style={{ padding: '7px 8px', textAlign: 'center' }}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {onTheRoadShipments.slice(0, 6).map(s => {
                  const veh = vehicles.find(v => v.id === s.vehicleId);
                  const cust = customers.find(c => c.id === s.customerId);
                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '7px 8px', fontWeight: 800, color: 'var(--diza-red)', fontFamily: 'monospace' }}>
                        {s.shipmentNo}
                      </td>
                      <td style={{ padding: '7px 8px' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{veh?.plate || s.vehiclePlate || '47 AAC 114'}</div>
                        <div style={{ fontSize: 10, color: '#64748b' }}>{veh?.driverName || s.driverName || 'Sürücü'}</div>
                      </td>
                      <td style={{ padding: '7px 8px', fontWeight: 600, color: '#0f172a' }}>
                        {cust?.name || s.customerName || 'Firma'}
                      </td>
                      <td style={{ padding: '7px 8px', fontSize: 11 }}>
                        <span style={{ color: '#047857', fontWeight: 700 }}>{s.loadingLocation}</span> → <span style={{ color: '#b91c1c', fontWeight: 700 }}>{s.unloadingLocation}</span>
                      </td>
                      <td style={{ padding: '7px 8px', fontWeight: 700, color: '#475569' }}>
                        {s.goodsType} ({s.quantity} {s.unit || 'Ton'})
                      </td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 800, fontFamily: 'monospace', color: '#0f172a' }}>
                        {s.totalAmount?.toLocaleString('tr-TR')} ₺
                      </td>
                      <td style={{ padding: '7px 8px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => completeShipment(s.id)}
                          style={{
                            background: '#10b981',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 4,
                            padding: '3px 7px',
                            fontSize: 10.5,
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                          title="Seferi Teslim Edildi Olarak Tamamla"
                        >
                          Tamamla
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {onTheRoadShipments.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: 25, textAlign: 'center', color: '#94a3b8' }}>
                      Şu anda yolda olan aktif sefer bulunmuyor.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobilde Dokunmatik İşlem Kartları */}
          <div className="mobile-only-cards">
            {onTheRoadShipments.slice(0, 6).map(s => {
              const veh = vehicles.find(v => v.id === s.vehicleId);
              const cust = customers.find(c => c.id === s.customerId);
              return (
                <div key={s.id} className="mobile-action-card">
                  <div className="card-top-row">
                    <div className="card-plate-badge">
                      <Truck size={15} color="var(--diza-red)" />
                      <strong>{veh?.plate || s.vehiclePlate || 'Araç'}</strong>
                      <span className="card-driver-tag">{veh?.driverName || s.driverName || 'Şoför'}</span>
                    </div>
                    <span className="card-status-badge on-road">YOLDA</span>
                  </div>

                  <div className="card-route-row">
                    <span className="from-loc">{s.loadingLocation}</span>
                    <span className="route-arrow">➔</span>
                    <span className="to-loc">{s.unloadingLocation}</span>
                  </div>

                  <div className="card-meta-row">
                    <span>{cust?.name || s.customerName || 'Müşteri'} • {s.goodsType} ({s.quantity} {s.unit || 'Ton'})</span>
                  </div>

                  <div className="card-bottom-row">
                    <div className="card-amount">
                      <span className="label">Navlun:</span>
                      <strong>{s.totalAmount?.toLocaleString('tr-TR')} ₺</strong>
                    </div>
                    <button
                      type="button"
                      className="btn btn-success btn-sm card-action-btn"
                      onClick={() => completeShipment(s.id)}
                    >
                      ✓ Teslim Et
                    </button>
                  </div>
                </div>
              );
            })}

            {onTheRoadShipments.length === 0 && (
              <div className="mobile-empty-card">
                Şu anda yolda olan aktif sefer bulunmuyor.
              </div>
            )}
          </div>
        </div>

        {/* SAĞ: Son Kasa & Nakit Hareketleri Masası */}
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden', borderRadius: 8 }}>
          <div
            style={{
              padding: '10px 14px',
              background: '#0f172a',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Wallet size={16} color="#4ade80" />
              <strong style={{ fontSize: 13 }}>Canlı Kasa & Nakit Giriş/Çıkış Defteri</strong>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('cashbook')}
              style={{ background: 'none', border: 'none', color: '#4ade80', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
            >
              Kasa Defterine Git <ChevronRight size={13} />
            </button>
          </div>

          {/* Masaüstü Tablo Görünümü */}
          <div className="desktop-only-table" style={{ overflowX: 'auto', maxHeight: 330, background: '#ffffff' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#475569', fontWeight: 800 }}>
                  <th style={{ padding: '7px 8px', textAlign: 'left' }}>Tarih</th>
                  <th style={{ padding: '7px 8px', textAlign: 'left' }}>Tür</th>
                  <th style={{ padding: '7px 8px', textAlign: 'left' }}>Açıklama</th>
                  <th style={{ padding: '7px 8px', textAlign: 'left' }}>Kategori / Plaka</th>
                  <th style={{ padding: '7px 8px', textAlign: 'right' }}>Tutar</th>
                </tr>
              </thead>
              <tbody>
                {cashEntries.slice(0, 6).map(c => {
                  const isIncome = c.type === 'GIRIS';
                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '7px 8px', color: '#64748b' }}>{c.date}</td>
                      <td style={{ padding: '7px 8px' }}>
                        <span
                          style={{
                            background: isIncome ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                            color: isIncome ? '#059669' : '#dc2626',
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontSize: 10.5,
                            fontWeight: 800
                          }}
                        >
                          {isIncome ? 'GİRİŞ' : 'ÇIKIŞ'}
                        </span>
                      </td>
                      <td style={{ padding: '7px 8px', fontWeight: 700, color: '#0f172a' }}>
                        {c.description}
                      </td>
                      <td style={{ padding: '7px 8px', fontSize: 11, color: '#64748b' }}>
                        {c.category} {c.vehiclePlate ? `• ${c.vehiclePlate}` : ''}
                      </td>
                      <td
                        style={{
                          padding: '7px 8px',
                          textAlign: 'right',
                          fontWeight: 900,
                          fontFamily: 'monospace',
                          color: isIncome ? '#059669' : '#dc2626'
                        }}
                      >
                        {isIncome ? '+' : '-'}{c.amount?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {c.currency}
                      </td>
                    </tr>
                  );
                })}

                {cashEntries.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: 25, textAlign: 'center', color: '#94a3b8' }}>
                      Kayıtlı kasa hareketi bulunmuyor.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobilde Kasa Kartları */}
          <div className="mobile-only-cards">
            {cashEntries.slice(0, 6).map(c => {
              const isIncome = c.type === 'GIRIS';
              return (
                <div key={c.id} className={`mobile-action-card cash-card ${isIncome ? 'income' : 'expense'}`}>
                  <div className="card-top-row">
                    <span className={`card-status-badge ${isIncome ? 'income' : 'expense'}`}>
                      {isIncome ? '↓ KASAYA GİRİŞ' : '↑ KASADAN ÇIKIŞ'}
                    </span>
                    <span className="card-date-tag">{c.date}</span>
                  </div>
                  <div className="card-meta-row" style={{ marginTop: 6, fontWeight: 700, color: '#0f172a' }}>
                    {c.description}
                  </div>
                  <div className="card-bottom-row" style={{ marginTop: 6 }}>
                    <span style={{ fontSize: 11, color: '#64748b' }}>{c.category}</span>
                    <strong style={{ fontSize: 15, fontFamily: 'monospace', color: isIncome ? '#059669' : '#dc2626' }}>
                      {isIncome ? '+' : '-'}{c.amount?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {c.currency}
                    </strong>
                  </div>
                </div>
              );
            })}

            {cashEntries.length === 0 && (
              <div className="mobile-empty-card">
                Kayıtlı kasa hareketi bulunmuyor.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. ALT BÖLÜM: SON KESİLEN 10 FATURA VE ŞİRKET BİLGİ ÖZETİ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: 14 }}>
        {/* Son Kesilen 10 Fatura */}
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden', borderRadius: 8 }}>
          <div
            style={{
              padding: '10px 14px',
              background: '#0f172a',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={16} color="var(--diza-red)" />
              <strong style={{ fontSize: 13 }}>Son Kesilen Faturalar (Son 10 Fatura)</strong>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('invoices')}
              style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
            >
              Fatura Modülüne Git <ChevronRight size={13} />
            </button>
          </div>

          <div style={{ overflowX: 'auto', maxHeight: 310, background: '#ffffff' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#475569', fontWeight: 800 }}>
                  <th style={{ padding: '7px 8px', textAlign: 'left' }}>Fatura No</th>
                  <th style={{ padding: '7px 8px', textAlign: 'left' }}>Tarih</th>
                  <th style={{ padding: '7px 8px', textAlign: 'left' }}>Müşteri / Firma</th>
                  <th style={{ padding: '7px 8px', textAlign: 'center' }}>Tür</th>
                  <th style={{ padding: '7px 8px', textAlign: 'right' }}>Genel Toplam</th>
                  <th style={{ padding: '7px 8px', textAlign: 'center' }}>Durum</th>
                </tr>
              </thead>
              <tbody>
                {invoices.slice(0, 10).map(inv => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '7px 8px', fontWeight: 800, color: 'var(--diza-red)', fontFamily: 'monospace' }}>
                      {inv.invoiceNo}
                    </td>
                    <td style={{ padding: '7px 8px', color: '#64748b' }}>{inv.invoiceDate}</td>
                    <td style={{ padding: '7px 8px', fontWeight: 700, color: '#0f172a' }}>
                      {inv.customerName}
                    </td>
                    <td style={{ padding: '7px 8px', textAlign: 'center' }}>
                      <span
                        style={{
                          background: inv.type === 'SATIS' ? 'rgba(37,99,235,0.1)' : 'rgba(245,158,11,0.1)',
                          color: inv.type === 'SATIS' ? '#1d4ed8' : '#b45309',
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 800
                        }}
                      >
                        {inv.type === 'SATIS' ? 'SATIŞ' : 'ALIŞ'}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '7px 8px',
                        textAlign: 'right',
                        fontWeight: 900,
                        fontFamily: 'monospace',
                        color: '#0f172a'
                      }}
                    >
                      {inv.grandTotal?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {inv.currency}
                    </td>
                    <td style={{ padding: '7px 8px', textAlign: 'center' }}>
                      <span
                        style={{
                          background: inv.paymentStatus === 'ODENDI' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                          color: inv.paymentStatus === 'ODENDI' ? '#059669' : '#dc2626',
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 800
                        }}
                      >
                        {inv.paymentStatus === 'ODENDI' ? 'ÖDENDİ' : 'ÖDENMEDİ'}
                      </span>
                    </td>
                  </tr>
                ))}

                {invoices.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: 25, textAlign: 'center', color: '#94a3b8' }}>
                      Henüz kesilen fatura kaydı bulunmuyor.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* En Çok İşlem Yapan 10 Cari */}
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden', borderRadius: 8 }}>
          <div
            style={{
              padding: '10px 14px',
              background: '#0f172a',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={16} color="#10b981" />
              <strong style={{ fontSize: 13 }}>En Çok İşlem Yapan Cariler (İlk 10 Cari)</strong>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('customers')}
              style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
            >
              Tüm Cariler <ChevronRight size={13} />
            </button>
          </div>

          <div style={{ overflowX: 'auto', maxHeight: 310, background: '#ffffff' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#475569', fontWeight: 800 }}>
                  <th style={{ padding: '7px 8px', textAlign: 'left' }}>Cari Kodu</th>
                  <th style={{ padding: '7px 8px', textAlign: 'left' }}>Firma / Ünvan</th>
                  <th style={{ padding: '7px 8px', textAlign: 'center' }}>Sefer / İşlem</th>
                  <th style={{ padding: '7px 8px', textAlign: 'right' }}>Toplam Hacim</th>
                  <th style={{ padding: '7px 8px', textAlign: 'left' }}>Şehir / Bölge</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Müşterilerin işlem hacmi ve sefer sayılarını hesapla
                  const customerStats = customers.map(c => {
                    const custShipments = shipments.filter(s => s.customerId === c.id);
                    const custInvoices = invoices.filter(i => i.customerId === c.id);
                    const shipmentCount = custShipments.length + custInvoices.length;
                    const totalVolume = custShipments.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0) +
                                        custInvoices.reduce((sum, i) => sum + (Number(i.grandTotal) || 0), 0);
                    return {
                      customer: c,
                      shipmentCount,
                      totalVolume
                    };
                  });

                  // İşlem sayısı veya hacmine göre azalan sırala
                  const top10 = customerStats
                    .sort((a, b) => b.shipmentCount - a.shipmentCount || b.totalVolume - a.totalVolume)
                    .slice(0, 10);

                  return top10.map(({ customer: c, shipmentCount, totalVolume }) => (
                    <tr
                      key={c.id}
                      style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                      onClick={() => setActiveTab('vehicles')}
                      title="Cari Hareketlerine Git"
                    >
                      <td style={{ padding: '7px 8px', fontWeight: 800, color: 'var(--diza-red)', fontFamily: 'monospace' }}>
                        C-{c.id}
                      </td>
                      <td style={{ padding: '7px 8px', fontWeight: 700, color: '#0f172a' }}>
                        {c.name}
                      </td>
                      <td style={{ padding: '7px 8px', textAlign: 'center' }}>
                        <span
                          style={{
                            background: 'rgba(37,99,235,0.1)',
                            color: '#1d4ed8',
                            padding: '2px 8px',
                            borderRadius: 10,
                            fontSize: 10.5,
                            fontWeight: 800
                          }}
                        >
                          {shipmentCount > 0 ? `${shipmentCount} İşlem` : 'Kayıtlı'}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: '7px 8px',
                          textAlign: 'right',
                          fontWeight: 900,
                          fontFamily: 'monospace',
                          color: '#059669'
                        }}
                      >
                        {totalVolume > 0 ? `${totalVolume.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺` : '-'}
                      </td>
                      <td style={{ padding: '7px 8px', color: '#64748b' }}>
                        {c.city || 'Mersin'} {c.district ? `• ${c.district}` : ''}
                      </td>
                    </tr>
                  ));
                })()}

                {customers.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: 25, textAlign: 'center', color: '#94a3b8' }}>
                      Henüz kayıtlı cari bulunmuyor.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
