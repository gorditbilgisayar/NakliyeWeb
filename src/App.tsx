import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { NotificationModal } from './components/NotificationModal';

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
  const { activeTab } = useApp();

  // Modallar
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isShipmentModalOpen, setIsShipmentModalOpen] = useState(false);
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

      {/* Vade & Risk Bildirim Modalı */}
      <NotificationModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
      />
    </div>
  );
};
