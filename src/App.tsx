import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { NotificationModal } from './components/NotificationModal';
import { MobileQuickActionFab } from './components/MobileQuickActionFab';
import { MobileShipmentWizardModal } from './components/MobileShipmentWizardModal';
import { MobileCashWizardModal } from './components/MobileCashWizardModal';

import { DashboardView } from './views/DashboardView';
import { VehicleRegistrationView } from './views/VehicleRegistrationView';
import { ShipmentsView } from './views/ShipmentsView';
import { VehiclesView } from './views/VehiclesView';
import { CustomersView } from './views/CustomersView';
import { InvoicesView } from './views/InvoicesView';
import { CashBookView } from './views/CashBookView';
import { RemindersView } from './views/RemindersView';
import { EnvelopePrintView } from './views/EnvelopePrintView';
import { ParametersView } from './views/ParametersView';

export const MainApp: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  // Modallar
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isShipmentModalOpen, setIsShipmentModalOpen] = useState(false);
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Yeni Mobil Kolay Sihirbaz Modalları
  const [isMobileShipmentWizardOpen, setIsMobileShipmentWizardOpen] = useState(false);
  const [isMobileCashWizardOpen, setIsMobileCashWizardOpen] = useState(false);

  return (
    <div className="app-container">
      {/* Masaüstü & Mobil Çekmece Sidebar */}
      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Ana Gövde */}
      <div className="main-wrapper">
        {/* Üst Header */}
        <Header
          onOpenReminders={() => setIsReminderModalOpen(true)}
          onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
        />

        {/* Dinamik Görünüm */}
        <main className="content-area">
          {activeTab === 'dashboard' && (
            <DashboardView
              onOpenNewShipment={() => setIsShipmentModalOpen(true)}
              onOpenNewCash={() => setIsCashModalOpen(true)}
              onOpenNewInvoice={() => setIsInvoiceModalOpen(true)}
            />
          )}

          {activeTab === 'vehicle_registration' && <VehicleRegistrationView />}

          {activeTab === 'shipments' && (
            <ShipmentsView
              isOpenNewModal={isShipmentModalOpen}
              onOpenNewModal={() => setIsShipmentModalOpen(true)}
              onCloseNewModal={() => setIsShipmentModalOpen(false)}
            />
          )}

          {activeTab === 'vehicles' && <VehiclesView />}

          {activeTab === 'customers' && <CustomersView />}

          {activeTab === 'invoices' && (
            <InvoicesView
              isOpenNewModal={isInvoiceModalOpen}
              onOpenNewModal={() => setIsInvoiceModalOpen(true)}
              onCloseNewModal={() => setIsInvoiceModalOpen(false)}
            />
          )}

          {activeTab === 'cashbook' && (
            <CashBookView
              isOpenNewModal={isCashModalOpen}
              onOpenNewModal={() => setIsCashModalOpen(true)}
              onCloseNewModal={() => setIsCashModalOpen(false)}
            />
          )}

          {activeTab === 'reminders' && <RemindersView />}

          {activeTab === 'envelopes' && <EnvelopePrintView />}

          {activeTab === 'parameters' && <ParametersView />}
        </main>
      </div>

      {/* Mobil Alt Bar */}
      <BottomNav onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

      {/* Mobil Hızlı Eylem Butonu (FAB) */}
      <MobileQuickActionFab
        onNewShipment={() => setIsMobileShipmentWizardOpen(true)}
        onNewCash={() => setIsMobileCashWizardOpen(true)}
        onNewInvoice={() => {
          setActiveTab('invoices');
          setIsInvoiceModalOpen(true);
        }}
        onNewReminder={() => {
          setActiveTab('reminders');
          setIsReminderModalOpen(true);
        }}
      />

      {/* Mobil Kolay Sevkiyat Sihirbazı */}
      <MobileShipmentWizardModal
        isOpen={isMobileShipmentWizardOpen}
        onClose={() => setIsMobileShipmentWizardOpen(false)}
      />

      {/* Mobil Kolay Kasa Sihirbazı */}
      <MobileCashWizardModal
        isOpen={isMobileCashWizardOpen}
        onClose={() => setIsMobileCashWizardOpen(false)}
      />

      {/* Vade & Risk Bildirim Modalı */}
      <NotificationModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
      />
    </div>
  );
};
