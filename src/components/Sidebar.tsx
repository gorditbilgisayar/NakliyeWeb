import React from 'react';
import { useApp, ActiveTab } from '../context/AppContext';
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  Truck,
  Users,
  FileText,
  Wallet,
  Clock,
  Mail,
  Sliders,
  X
} from 'lucide-react';

export const Sidebar: React.FC<{
  isOpen?: boolean;
  onClose?: () => void;
}> = ({ isOpen = false, onClose }) => {
  const { activeTab, setActiveTab, shipments, reminders, vehicles } = useApp();

  const pendingShipments = shipments.filter(s => s.status === 'SIPARIS').length;
  const activeVehicles = vehicles.filter(v => v.isActive).length;
  const pendingReminders = reminders.filter(r => r.status === 'BEKLIYOR').length;

  const menuItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Genel Bakış', icon: <LayoutDashboard size={18} /> },
    { id: 'vehicle_registration', label: 'Araç Kayıt', icon: <ClipboardList size={18} />, badge: vehicles.length },
    { id: 'shipments', label: 'Sevkiyat Listesi', icon: <Package size={18} />, badge: pendingShipments },
    { id: 'vehicles', label: 'Cari Hareketler', icon: <Truck size={18} />, badge: activeVehicles },
    { id: 'customers', label: 'Firma ve Cariler', icon: <Users size={18} /> },
    { id: 'invoices', label: 'Fatura & Tevkifat', icon: <FileText size={18} /> },
    { id: 'cashbook', label: 'Kasa Defteri', icon: <Wallet size={18} /> },
    { id: 'reminders', label: 'Vade & Çek/Senet', icon: <Clock size={18} />, badge: pendingReminders },
    { id: 'envelopes', label: 'Zarf Yazdırma', icon: <Mail size={18} /> },
    { id: 'parameters', label: 'Parametreler', icon: <Sliders size={18} /> },
  ];

  const handleSelectTab = (id: ActiveTab) => {
    setActiveTab(id);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobil Backdrop Karartma */}
      {isOpen && (
        <div
          className="sidebar-backdrop no-print"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar no-print ${isOpen ? 'mobile-open' : ''}`}>
        {/* DİZA Kurumsal Logo */}
        <div className="sidebar-logo">
          <div className="logo-badge">D</div>
          <div className="logo-text">
            <h1>DİZA <span>LOJİSTİK</span></h1>
            <p>Filo & Nakliye ERP</p>
          </div>
          {onClose && (
            <button
              type="button"
              className="sidebar-close-btn"
              onClick={onClose}
              aria-label="Menüyü Kapat"
            >
              <X size={20} />
            </button>
          )}
        </div>

      {/* Navigasyon Menüsü */}
      <nav className="sidebar-menu">
        {menuItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => handleSelectTab(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="badge">{item.badge}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Telif & Alt Bilgi */}
      <div className="sidebar-footer">
        <strong>Gördit Bilgisayar</strong>
        <p>Zafer GÖRGÜN © 2026</p>
        <span style={{ fontSize: '10px', color: 'var(--diza-red)', fontWeight: 800 }}>v2.5.4 Kurumsal</span>
      </div>
    </aside>
    </>
  );
};
