import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Vehicle, Customer, Shipment, Invoice, CashEntry, ReminderCheck, ExchangeRate, CurrencyType, OrderParamRow, VehicleShipmentRow
} from '../types';
import {
  initialVehicles, initialCustomers, initialShipments, initialInvoices,
  initialCashEntries, initialReminders, initialExchangeRates
} from '../data/initialData';
import { numberToWords } from '../utils/numberToWords';

export type ActiveTab = 'dashboard' | 'vehicle_registration' | 'shipments' | 'vehicles' | 'customers' | 'invoices' | 'cashbook' | 'reminders' | 'envelopes' | 'parameters';

export interface VatRateOption {
  id: number;
  name: string;
  rate: number;
  isDefault: boolean;
}

interface AppContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  vehicles: Vehicle[];
  customers: Customer[];
  shipments: Shipment[];
  invoices: Invoice[];
  cashEntries: CashEntry[];
  reminders: ReminderCheck[];
  exchangeRates: ExchangeRate[];
  
  // KDV Parametreleri
  vatRates: VatRateOption[];
  defaultVatRate: number;
  setDefaultVatRate: (rate: number) => void;
  updateVatRates: (rates: VatRateOption[]) => void;

  // Sipariş & Sevkiyat Parametreleri (Tanımlı Yükler)
  orderParamRows: OrderParamRow[];
  setOrderParamRows: React.Dispatch<React.SetStateAction<OrderParamRow[]>>;
  updateOrderParamRows: (rows: OrderParamRow[]) => void;

  // Cinsi Parametreleri (Yük Cinsleri)
  cinsiList: { id: number; name: string; notes?: string }[];
  setCinsiList: React.Dispatch<React.SetStateAction<{ id: number; name: string; notes?: string }[]>>;
  updateCinsiList: (list: { id: number; name: string; notes?: string }[]) => void;
  
  // Araç Metodları
  addVehicle: (v: Omit<Vehicle, 'id'>) => void;
  updateVehicle: (id: number, v: Partial<Vehicle>) => void;
  deleteVehicle: (id: number) => void;

  // Müşteri Metodları
  addCustomer: (c: Omit<Customer, 'id'>) => void;
  updateCustomer: (id: number, c: Partial<Customer>) => void;
  deleteCustomer: (id: number) => void;

  // Yük & Sevkiyat Metodları
  addShipment: (s: Omit<Shipment, 'id' | 'shipmentNo' | 'totalAmount' | 'vatAmount' | 'withholdingAmount' | 'netPayableAmount'>) => void;
  updateShipment: (id: number, s: Partial<Shipment>) => void;
  deleteShipment: (id: number) => void;
  assignVehicleToShipment: (shipmentId: number, vehicleId: number, freightCost: number) => void;
  completeShipment: (shipmentId: number) => void;
  syncVehicleShipmentRow: (vehicleId: number, row: VehicleShipmentRow, vehiclePlate?: string, driverName?: string) => void;
  removeVehicleShipmentRow: (rowSNo: string, rowId: number) => void;

  // Fatura Metodları
  createInvoiceFromShipments: (customerId: number, shipmentIds: number[], invoiceNo: string, invoiceDate: string, notes?: string) => Invoice;
  addInvoice: (inv: Omit<Invoice, 'id'>) => void;
  updateInvoice: (id: number, inv: Partial<Invoice>) => void;
  deleteInvoice: (id: number) => void;

  // Kasa Metodları
  addCashEntry: (entry: Omit<CashEntry, 'id'>) => void;
  deleteCashEntry: (id: number) => void;

  // Vade & Çek / Senet Metodları
  addReminder: (rem: Omit<ReminderCheck, 'id'>) => void;
  updateReminderStatus: (id: number, status: ReminderCheck['status']) => void;
  deleteReminder: (id: number) => void;

  // Hesaplamalar
  getCashBalance: (currency: CurrencyType) => number;
  getVehicleBalance: (vehicleId: number, currency: CurrencyType) => { alacak: number; borc: number; bakiye: number };
  getCustomerBalance: (customerId: number, currency: CurrencyType) => { alacak: number; borc: number; bakiye: number };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function loadStoredData<T>(key: string, fallback: T): T {
  const saved = localStorage.getItem(key);
  if (!saved) return fallback;

  try {
    return JSON.parse(saved) as T;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    return loadStoredData('diza_vehicles', initialVehicles);
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    return loadStoredData('diza_customers', initialCustomers);
  });

  const [shipments, setShipments] = useState<Shipment[]>(() => {
    return loadStoredData('diza_shipments', initialShipments);
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    return loadStoredData('diza_invoices', initialInvoices);
  });

  const [cashEntries, setCashEntries] = useState<CashEntry[]>(() => {
    return loadStoredData('diza_cash', initialCashEntries);
  });

  const [reminders, setReminders] = useState<ReminderCheck[]>(() => {
    return loadStoredData('diza_reminders', initialReminders);
  });

  const initialOrderParamRows: OrderParamRow[] = [
    {
      id: 1,
      sip_id: '1',
      show: true,
      loadTitle: 'MERSİN',
      company: 'ETİ BAKIR A.Ş.',
      transporter: 'TÜRKLER NAKLİYAT',
      intermediary: 'TÜRKLER NAK',
      loadingPlace: 'ETİ BAKIR MADEN',
      unloadingPlace: 'MERSİN LİMAN',
      unloadingDistrict: 'AKDENİZ',
      goodsType: 'DEMİROKSİT',
      quantity: 27.5,
      buyPrice: 250.00,
      sellPrice: 260.00,
      vatRate: 20,
      commission: 1000,
      dispatchAddress: 'Mersin Serbest Bölge Girişi',
      orderDate: new Date().toISOString().split('T')[0],
      orderSeqNo: 'SIP-001',
      orderProduct: 'Demiroksit Cevheri',
      orderCustomer: 'ETİ BAKIR A.Ş.'
    },
    {
      id: 2,
      sip_id: '2',
      show: true,
      loadTitle: 'İSKENDERUN',
      company: 'TOSYALI DEMİR ÇELİK',
      transporter: 'TÜRKLER NAKLİYAT',
      intermediary: 'TÜRKLER NAK',
      loadingPlace: 'ETİ BAKIR MADEN',
      unloadingPlace: 'HATAY',
      unloadingDistrict: 'İSKENDERUN',
      goodsType: 'DÖKME MADEN',
      quantity: 26.0,
      buyPrice: 220.00,
      sellPrice: 230.00,
      vatRate: 20,
      commission: 1000,
      dispatchAddress: 'İskenderun Organize Sanayi',
      orderDate: new Date().toISOString().split('T')[0],
      orderSeqNo: 'SIP-002',
      orderProduct: 'Dökme Maden',
      orderCustomer: 'TOSYALI DEMİR ÇELİK'
    },
    {
      id: 3,
      sip_id: '3',
      show: true,
      loadTitle: 'KIZILTEPE MISIR',
      company: 'TÜRKLER TARIM ÜRÜNLERİ',
      transporter: 'TÜRKLER NAKLİYAT',
      intermediary: 'TÜRKLER NAK',
      loadingPlace: 'KIZILTEPE SİLO',
      unloadingPlace: 'GAZİANTEP',
      unloadingDistrict: 'ŞEHİTKAMİL',
      goodsType: 'MISIR',
      quantity: 28.0,
      buyPrice: 180.00,
      sellPrice: 195.00,
      vatRate: 1,
      commission: 800,
      dispatchAddress: 'Gaziantep 4. OSB Un Fabrikası',
      orderDate: new Date().toISOString().split('T')[0],
      orderSeqNo: 'SIP-003',
      orderProduct: 'Sarı Mısır',
      orderCustomer: 'TÜRKLER TARIM ÜRÜNLERİ'
    }
  ];

  const [orderParamRows, setOrderParamRows] = useState<OrderParamRow[]>(() => {
    return loadStoredData('diza_order_param_rows', initialOrderParamRows);
  });

  const updateOrderParamRows = (rows: OrderParamRow[]) => {
    setOrderParamRows(rows);
  };

  const initialCinsiList = [
    { id: 1, name: 'DÖKME', notes: 'Dökme maden ve hammadde' },
    { id: 2, name: 'MISIR', notes: 'Tahıl / Tarım ürünü' },
    { id: 3, name: 'PAKET', notes: 'Paketli / Paletli sanayi yükü' },
    { id: 4, name: 'ÇİNKO', notes: 'Külçe veya konsantre çinko' },
    { id: 5, name: 'COBALT', notes: 'Kobalt madeni' },
    { id: 6, name: 'BAKIR', notes: 'Katot / Konsantre bakır cevheri' },
    { id: 7, name: 'MEKANİK', notes: 'Mekanik parça ve ekipman' },
    { id: 8, name: 'MADEN CEVHERİ', notes: 'Ham maden cevheri' },
    { id: 9, name: 'ORGANİK GÜBRE', notes: 'Tarım ve gübre sevkiyatı' },
    { id: 10, name: 'DEMİROKSİT', notes: 'Demir oksit tozu/cevheri' },
    { id: 11, name: 'BUĞDAY', notes: 'Hububat / Dökme buğday' },
    { id: 12, name: 'SANAYİ BORUSU', notes: 'Profil ve boru taşıma' },
    { id: 13, name: 'HURDA', notes: 'Geri dönüşüm metal hurda' },
    { id: 14, name: 'ÇİMENTO', notes: 'Torba veya silobas çimento' }
  ];

  const [cinsiList, setCinsiList] = useState<{ id: number; name: string; notes?: string }[]>(() => {
    return loadStoredData('diza_cinsi_list', initialCinsiList);
  });

  const updateCinsiList = (list: { id: number; name: string; notes?: string }[]) => {
    setCinsiList(list);
  };

  const [vatRates, setVatRates] = useState<VatRateOption[]>(() => {
    return loadStoredData('diza_vat_rates', [
      { id: 1, name: '%20 Genel KDV', rate: 20, isDefault: true },
      { id: 2, name: '%10 İndirimli KDV', rate: 10, isDefault: false },
      { id: 3, name: '%1 Özel KDV', rate: 1, isDefault: false },
      { id: 4, name: '%0 KDV İstisnası', rate: 0, isDefault: false }
    ]);
  });

  const defaultVatRate = vatRates.find(v => v.isDefault)?.rate ?? 20;

  const setDefaultVatRate = (rate: number) => {
    setVatRates(prev =>
      prev.map(v => ({
        ...v,
        isDefault: v.rate === rate
      }))
    );
  };

  const updateVatRates = (rates: VatRateOption[]) => {
    setVatRates(rates);
  };

  const [exchangeRates] = useState<ExchangeRate[]>(initialExchangeRates);

  // Yerel kalıcılık
  useEffect(() => { localStorage.setItem('diza_vehicles', JSON.stringify(vehicles)); }, [vehicles]);
  useEffect(() => { localStorage.setItem('diza_customers', JSON.stringify(customers)); }, [customers]);
  useEffect(() => { localStorage.setItem('diza_shipments', JSON.stringify(shipments)); }, [shipments]);
  useEffect(() => { localStorage.setItem('diza_invoices', JSON.stringify(invoices)); }, [invoices]);
  useEffect(() => { localStorage.setItem('diza_cash', JSON.stringify(cashEntries)); }, [cashEntries]);
  useEffect(() => { localStorage.setItem('diza_reminders', JSON.stringify(reminders)); }, [reminders]);
  useEffect(() => { localStorage.setItem('diza_vat_rates', JSON.stringify(vatRates)); }, [vatRates]);
  useEffect(() => { localStorage.setItem('diza_order_param_rows', JSON.stringify(orderParamRows)); }, [orderParamRows]);
  useEffect(() => { localStorage.setItem('diza_cinsi_list', JSON.stringify(cinsiList)); }, [cinsiList]);

  // Tevkifat Hesaplayıcı Yardımcı
  const calculateWithholding = (baseAmount: number, vatRate: number, rateStr: string) => {
    const vat = baseAmount * (vatRate / 100);
    let withAmount = 0;
    if (rateStr === '2/10') withAmount = vat * 0.2;
    else if (rateStr === '3/10') withAmount = vat * 0.3;
    else if (rateStr === '4/10') withAmount = vat * 0.4;
    else if (rateStr === '5/10') withAmount = vat * 0.5;
    else if (rateStr === '7/10') withAmount = vat * 0.7;
    else if (rateStr === '9/10') withAmount = vat * 0.9;
    return {
      vatAmount: vat,
      withholdingAmount: withAmount,
      netPayable: baseAmount + vat - withAmount
    };
  };

  // Araç Eylemleri
  const addVehicle = (v: Omit<Vehicle, 'id'>) => {
    const newId = vehicles.length > 0 ? Math.max(...vehicles.map(x => x.id)) + 1 : 1;
    setVehicles(prev => [...prev, { ...v, id: newId }]);
  };

  const updateVehicle = (id: number, v: Partial<Vehicle>) => {
    setVehicles(prev => prev.map(item => item.id === id ? { ...item, ...v } : item));
  };

  const deleteVehicle = (id: number) => {
    setVehicles(prev => prev.filter(item => item.id !== id));
  };

  // Müşteri Eylemleri
  const addCustomer = (c: Omit<Customer, 'id'>) => {
    const newId = customers.length > 0 ? Math.max(...customers.map(x => x.id)) + 1 : 101;
    setCustomers(prev => [...prev, { ...c, id: newId }]);
  };

  const updateCustomer = (id: number, c: Partial<Customer>) => {
    setCustomers(prev => prev.map(item => item.id === id ? { ...item, ...c } : item));
  };

  const deleteCustomer = (id: number) => {
    setCustomers(prev => prev.filter(item => item.id !== id));
  };

  // Yük Eylemleri
  const addShipment = (s: Omit<Shipment, 'id' | 'shipmentNo' | 'totalAmount' | 'vatAmount' | 'withholdingAmount' | 'netPayableAmount'>) => {
    const newId = shipments.length > 0 ? Math.max(...shipments.map(x => x.id)) + 1 : 1;
    const base = s.quantity * s.unitPrice;
    const { vatAmount, withholdingAmount, netPayable } = calculateWithholding(base, s.vatRate, s.withholdingRate);
    const shipmentNo = `YK-2026-${String(newId).padStart(3, '0')}`;

    const newShipment: Shipment = {
      ...s,
      id: newId,
      shipmentNo,
      totalAmount: base,
      vatAmount,
      withholdingAmount,
      netPayableAmount: netPayable
    };

    setShipments(prev => [newShipment, ...prev]);
  };

  const updateShipment = (id: number, s: Partial<Shipment>) => {
    setShipments(prev => prev.map(item => {
      if (item.id === id) {
        const merged = { ...item, ...s };
        const base = merged.quantity * merged.unitPrice;
        const { vatAmount, withholdingAmount, netPayable } = calculateWithholding(base, merged.vatRate, merged.withholdingRate);
        return {
          ...merged,
          totalAmount: base,
          vatAmount,
          withholdingAmount,
          netPayableAmount: netPayable
        };
      }
      return item;
    }));
  };

  const deleteShipment = (id: number) => {
    setShipments(prev => prev.filter(item => item.id !== id));
  };

  const assignVehicleToShipment = (shipmentId: number, vehicleId: number, freightCost: number) => {
    const veh = vehicles.find(v => v.id === vehicleId);
    if (!veh) return;
    setShipments(prev => prev.map(s => {
      if (s.id === shipmentId) {
        return {
          ...s,
          vehicleId: veh.id,
          vehiclePlate: veh.plate,
          driverName: veh.driverName,
          driverPhone: veh.phone,
          driverFreightCost: freightCost,
          status: 'YOLDA'
        };
      }
      return s;
    }));
  };

  const completeShipment = (shipmentId: number) => {
    setShipments(prev => prev.map(s => {
      if (s.id === shipmentId) {
        return {
          ...s,
          status: 'TESLIM_EDILDI',
          deliveryDate: new Date().toISOString().split('T')[0]
        };
      }
      return s;
    }));
  };

  const syncVehicleShipmentRow = (vehicleId: number, row: VehicleShipmentRow, vehiclePlate?: string, driverName?: string) => {
    // Müşteri eşleştirme
    const matchedCustomer = customers.find(
      c => c.name.toLowerCase().includes(row.company.toLowerCase()) ||
           row.company.toLowerCase().includes(c.name.toLowerCase())
    ) || customers[0] || { id: 101, name: row.company || 'Cari Müşteri' };

    const qty = Number(row.quantity) || 1;
    const price = Number(row.sellPrice) || Number(row.buyPrice) || 0;
    const base = qty * price;
    const vat = Number(row.vatRate) || defaultVatRate;
    const { vatAmount, withholdingAmount, netPayable } = calculateWithholding(base, vat, '5/10');

    setShipments(prev => {
      const existingIndex = prev.findIndex(s => s.shipmentNo === row.sNo || (s.id === row.id && s.vehicleId === vehicleId));
      
      const newShipmentItem: Shipment = {
        id: row.id || Date.now(),
        shipmentNo: row.sNo || `S-${Date.now().toString().slice(-5)}`,
        orderDate: row.date || new Date().toISOString().split('T')[0],
        loadingDate: row.date || new Date().toISOString().split('T')[0],
        customerId: matchedCustomer.id,
        customerName: row.company || matchedCustomer.name,
        loadingLocation: row.loadingPlace || 'Yükleme Yeri',
        unloadingLocation: `${row.unloadingPlace || 'İndirme Yeri'}${row.unloadingDistrict ? ' / ' + row.unloadingDistrict : ''}`,
        senderCompany: row.company || 'Gönderici Firma',
        receiverCompany: row.unloadingPlace || 'Alıcı Firma',
        goodsType: row.goodsType || 'Muhtelif Yük',
        packaging: 'Dökme / Paletli',
        quantity: qty,
        unit: 'Ton',
        unitPrice: price,
        currency: 'TL',
        vatRate: vat,
        withholdingRate: '5/10',
        totalAmount: base,
        vatAmount,
        withholdingAmount,
        netPayableAmount: netPayable,
        vehicleId: vehicleId,
        vehiclePlate: row.plate || vehiclePlate || '47 AAC 114',
        driverName: driverName || 'Sürücü',
        driverFreightCost: (Number(row.buyPrice) || 0) * qty,
        status: 'YOLDA',
        invoiced: false,
        notes: row.notes || row.dispatchAddress || ''
      };

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          ...newShipmentItem,
          invoiced: updated[existingIndex].invoiced,
          invoiceId: updated[existingIndex].invoiceId,
          status: updated[existingIndex].invoiced ? 'FATURALANDI' : 'YOLDA'
        };
        return updated;
      } else {
        return [newShipmentItem, ...prev];
      }
    });
  };

  const removeVehicleShipmentRow = (rowSNo: string, rowId: number) => {
    setShipments(prev => prev.filter(s => s.shipmentNo !== rowSNo && s.id !== rowId));
  };

  // Yüklerden Otomatik Fatura Oluşturma (Access: Yukten_faturaya_ekleme)
  const createInvoiceFromShipments = (
    customerId: number,
    shipmentIds: number[],
    invoiceNo: string,
    invoiceDate: string,
    notes?: string
  ): Invoice => {
    const cust = customers.find(c => c.id === customerId);
    const selectedShipments = shipments.filter(s => shipmentIds.includes(s.id));
    const currencies = new Set(selectedShipments.map(s => s.currency));

    if (currencies.size > 1) {
      throw new Error('Farklı para birimlerindeki sevkiyatlar aynı faturada birleştirilemez.');
    }

    let subTotal = 0;
    let vatTotal = 0;
    let withholdingTotal = 0;

    const items = selectedShipments.map((s, idx) => {
      subTotal += s.totalAmount;
      vatTotal += s.vatAmount;
      withholdingTotal += s.withholdingAmount;
      return {
        id: `inv-item-${idx + 1}`,
        shipmentId: s.id,
        description: `${s.loadingLocation} -> ${s.unloadingLocation} ${s.goodsType} (${s.vehiclePlate || 'Araçsız'})`,
        quantity: s.quantity,
        unit: s.unit,
        unitPrice: s.unitPrice,
        currency: s.currency,
        vatRate: s.vatRate,
        withholdingRate: s.withholdingRate,
        total: s.totalAmount
      };
    });

    const grandTotal = subTotal + vatTotal - withholdingTotal;
    const newId = invoices.length > 0 ? Math.max(...invoices.map(x => x.id)) + 1 : 1;

    const newInvoice: Invoice = {
      id: newId,
      invoiceNo,
      invoiceDate,
      type: 'SATIS',
      customerId,
      customerName: cust ? cust.name : 'Müşteri',
      taxOffice: cust?.taxOffice,
      taxNumber: cust?.taxNumber,
      address: cust?.address,
      currency: selectedShipments[0]?.currency || 'TL',
      exchangeRate: 1.0,
      subTotal,
      vatTotal,
      withholdingTotal,
      grandTotal,
      writtenText: numberToWords(grandTotal, selectedShipments[0]?.currency || 'TL'),
      paymentStatus: 'ODENMEDI',
      items,
      notes: notes || 'Tevkifat Kapsamında Taşımacılık Hizmeti Faturası'
    };

    setInvoices(prev => [newInvoice, ...prev]);

    // İlgili yükleri faturalandı olarak işaretle
    setShipments(prev => prev.map(s => {
      if (shipmentIds.includes(s.id)) {
        return { ...s, invoiced: true, invoiceId: newId, status: 'FATURALANDI' };
      }
      return s;
    }));

    return newInvoice;
  };

  const addInvoice = (inv: Omit<Invoice, 'id'>) => {
    const newId = invoices.length > 0 ? Math.max(...invoices.map(x => x.id)) + 1 : 1;
    setInvoices(prev => [{ ...inv, id: newId }, ...prev]);
  };

  const updateInvoice = (id: number, inv: Partial<Invoice>) => {
    setInvoices(prev => {
      const current = prev.find(item => item.id === id);
      if (!current) return prev;

      const updated = { ...current, ...inv };
      const previousShipmentIds = new Set(current.items.map(item => item.shipmentId).filter((shipmentId): shipmentId is number => shipmentId !== undefined));
      const updatedShipmentIds = new Set(updated.items.map(item => item.shipmentId).filter((shipmentId): shipmentId is number => shipmentId !== undefined));

      setShipments(currentShipments => currentShipments.map(shipment => {
        if (previousShipmentIds.has(shipment.id) && !updatedShipmentIds.has(shipment.id) && shipment.invoiceId === id) {
          return { ...shipment, invoiced: false, invoiceId: undefined, status: 'YOLDA' };
        }
        if (updatedShipmentIds.has(shipment.id)) {
          return { ...shipment, invoiced: true, invoiceId: id, status: 'FATURALANDI' };
        }
        return shipment;
      }));

      return prev.map(item => item.id === id ? updated : item);
    });
  };

  const deleteInvoice = (id: number) => {
    setInvoices(prev => prev.filter(item => item.id !== id));
    setShipments(prev => prev.map(shipment => shipment.invoiceId === id
      ? { ...shipment, invoiced: false, invoiceId: undefined, status: 'YOLDA' }
      : shipment
    ));
  };

  // Kasa
  const addCashEntry = (entry: Omit<CashEntry, 'id'>) => {
    const newId = cashEntries.length > 0 ? Math.max(...cashEntries.map(x => x.id)) + 1 : 1;
    setCashEntries(prev => [{ ...entry, id: newId }, ...prev]);
  };

  const deleteCashEntry = (id: number) => {
    setCashEntries(prev => prev.filter(item => item.id !== id));
  };

  // Vade & Çek
  const addReminder = (rem: Omit<ReminderCheck, 'id'>) => {
    const newId = reminders.length > 0 ? Math.max(...reminders.map(x => x.id)) + 1 : 1;
    setReminders(prev => [{ ...rem, id: newId }, ...prev]);
  };

  const updateReminderStatus = (id: number, status: ReminderCheck['status']) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const deleteReminder = (id: number) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  // Kasa Bakiyesi Hesaplayıcı
  const getCashBalance = (currency: CurrencyType): number => {
    return cashEntries
      .filter(e => e.currency === currency)
      .reduce((acc, curr) => {
        return curr.type === 'GIRIS' ? acc + curr.amount : acc - curr.amount;
      }, 0);
  };

  // Araç Bakiyesi Hesaplayıcı (Hakediş Alacağı vs Avans/Masraf Borcu)
  const getVehicleBalance = (vehicleId: number, currency: CurrencyType) => {
    const vehShipments = shipments.filter(s => s.vehicleId === vehicleId && s.currency === currency);
    const alacak = vehShipments.reduce((sum, s) => sum + (s.driverFreightCost || 0), 0);

    const veh = vehicles.find(v => v.id === vehicleId);
    const borc = cashEntries
      .filter(c => c.currency === currency && c.type === 'CIKIS' && c.vehiclePlate === veh?.plate)
      .reduce((sum, c) => sum + c.amount, 0);

    return {
      alacak,
      borc,
      bakiye: alacak - borc // Pozitifse şoföre borcumuz var (şoför alacaklı)
    };
  };

  // Müşteri Bakiyesi Hesaplayıcı (Fatura Borcu vs Tahsilat Alacağı)
  const getCustomerBalance = (customerId: number, currency: CurrencyType) => {
    const custInvoices = invoices.filter(i => i.customerId === customerId && i.currency === currency);
    const borc = custInvoices.reduce((sum, i) => sum + i.grandTotal, 0);

    const alacak = cashEntries
      .filter(c => c.currency === currency && c.type === 'GIRIS' && c.customerId === customerId)
      .reduce((sum, c) => sum + c.amount, 0);

    return {
      alacak,
      borc,
      bakiye: borc - alacak // Müşterinin bize kalan net borcu
    };
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        vehicles,
        customers,
        shipments,
        invoices,
        cashEntries,
        reminders,
        exchangeRates,
        vatRates,
        defaultVatRate,
        setDefaultVatRate,
        updateVatRates,
        orderParamRows,
        setOrderParamRows,
        updateOrderParamRows,
        cinsiList,
        setCinsiList,
        updateCinsiList,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addShipment,
        updateShipment,
        deleteShipment,
        assignVehicleToShipment,
        completeShipment,
        syncVehicleShipmentRow,
        removeVehicleShipmentRow,
        createInvoiceFromShipments,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        addCashEntry,
        deleteCashEntry,
        addReminder,
        updateReminderStatus,
        deleteReminder,
        getCashBalance,
        getVehicleBalance,
        getCustomerBalance
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
