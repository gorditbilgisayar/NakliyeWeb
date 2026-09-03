import React from 'react';
import { useApp, ActiveTab } from '../context/AppContext';
import {
  LayoutDashboard,
  Package,
  Truck,
  FileText,
  Wallet,
  Menu
} from 'lucide-react';

export const BottomNav: React.FC<{ onOpenMobileMenu?: () => void }> = ({ onOpenMobileMenu }) => {
  const { activeTab, setActiveTab } = useApp();

  const primaryTabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Özet', icon: <LayoutDashboard size={19} /> },
    { id: 'shipments', label: 'Sevkiyat', icon: <Package size={19} /> },
    { id: 'vehicles', label: 'Cari', icon: <Truck size={19} /> },
    { id: 'invoices', label: 'Fatura', icon: <FileText size={19} /> },
    { id: 'cashbook', label: 'Kasa', icon: <Wallet size={19} /> }
  ];

  return (
    <nav className="bottom-nav no-print">
      {primaryTabs.map(tab => (
        <button
          key={tab.id}
          type="button"
          className={`bottom-nav-item ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}

      {onOpenMobileMenu && (
        <button
          type="button"
          className="bottom-nav-item menu-trigger"
          onClick={onOpenMobileMenu}
          title="Tüm Modüller ve Menü"
        >
          <Menu size={19} />
          <span>Menü</span>
        </button>
      )}
    </nav>
  );
};
