import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { OrderParamRow } from '../types';
import { TURKEY_CITIES_DISTRICTS, CITIES_LIST } from '../utils/turkeyCities';
import { formatPhoneNumber } from '../utils/phoneFormatter';
import {
  Package,
  Tag,
  Wallet,
  DollarSign,
  CheckCircle,
  Trash2,
  Building,
  Receipt,
  FileText,
  CreditCard,
  Plus,
  Edit,
  Save,
  Upload,
  Image,
  X,
  ShieldCheck,
  RefreshCw,
  Search
} from 'lucide-react';

export const ParametersView: React.FC = () => {
  const {
    vatRates,
    defaultVatRate,
    setDefaultVatRate,
    updateVatRates,
    orderParamRows,
    setOrderParamRows,
    customers,
    cinsiList,
    setCinsiList
  } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'company' | 'cinsi' | 'orders' | 'cash' | 'expenses' | 'invoices'>('company');

  // İl adına göre ilçe listesini getiren yardımcı fonksiyon
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

  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 1. ŞİRKET BİLGİLERİ
  const [companySettings, setCompanySettings] = useState({
    companyName: 'GÖRDİT BİLGİSAYAR VE TAŞIMACILIK SAN. TİC. LTD. ŞTİ.',
    brandName: 'DİZA LOJİSTİK',
    authorizedPerson: 'Zafer GÖRGÜN',
    logoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&auto=format&fit=crop&q=80',
    taxOffice: 'Uray',
    taxNumber: '3120456789',
    tradeRegistryNo: 'MERSİN-45892',
    mersisNo: '0312045678900001',
    city: 'Mersin',
    district: 'Akdeniz',
    address: 'Liman Caddesi Diza Plaza Kat:4 No:12 Akdeniz / Mersin',
    phone: '0(324) 233 00 00',
    gsmPhone: '0(541) 608 53 44',
    fax: '0(324) 233 00 01',
    email: 'info@dizayazilim.com',
    website: 'www.dizayazilim.com',
    ibanTL: 'TR33 0006 2000 0001 2345 6789 01 - Garanti BBVA',
    ibanUSD: 'TR44 0006 2000 0001 2345 6789 02 - Garanti BBVA (USD)',
    ibanEUR: 'TR55 0006 2000 0001 2345 6789 03 - Garanti BBVA (EUR)',
    invoiceNote: 'Bu fatura muhteviyatı 5/10 Tevkifat kapsamındadır. İtiraz süresi 8 gündür.'
  });

  const availableCompanyDistricts = TURKEY_CITIES_DISTRICTS[companySettings.city || 'Mersin'] || ['Merkez'];

  // Logo Dosyası Yükleme & Değiştirme (FileReader ile Base64)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert('Lütfen 3 MB\'tan küçük bir logo görseli seçiniz.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanySettings(prev => ({
          ...prev,
          logoUrl: reader.result as string
        }));
        setSaveMessage('✓ Logo başarıyla yüklendi.');
        setTimeout(() => setSaveMessage(null), 2500);
      };
      reader.readAsDataURL(file);
    }
  };

  // Logo Silme
  const handleDeleteLogo = () => {
    if (window.confirm('Şirket logosunu silmek istediğinize emin misiniz?')) {
      setCompanySettings(prev => ({
        ...prev,
        logoUrl: ''
      }));
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSaveMessage('✓ Şirket logosu silindi.');
      setTimeout(() => setSaveMessage(null), 2500);
    }
  };

  const handleSaveCompanySettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveMessage('✓ Şirket Bilgileri başarıyla kaydedildi.');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  // 2. CİNSİ (AppContext üzerinden merkezi ve kalıcı)
  const [draftCinsi, setDraftCinsi] = useState<string>('');
  const [editingCinsi, setEditingCinsi] = useState<{ id: number; name: string } | null>(null);

  // 3. SİPARİŞ & SEVKİYAT PARAMETRELERİ (AppContext üzerinden merkezi ve kalıcı)
  const [draftOrderRow, setDraftOrderRow] = useState<Partial<OrderParamRow>>({
    sip_id: 'Yeni',
    show: true,
    loadTitle: '',
    company: '',
    transporter: '',
    intermediary: '',
    loadingPlace: 'ETİ BAKIR',
    unloadingPlace: 'MARDİN',
    unloadingDistrict: 'MERKEZ',
    goodsType: '',
    quantity: undefined,
    buyPrice: undefined,
    sellPrice: undefined,
    vatRate: 20,
    commission: undefined,
    dispatchAddress: '',
    orderDate: '',
    orderSeqNo: '',
    orderProduct: '',
    orderCustomer: ''
  });

  // 4. KASA PARAMETRELERİ
  const [cashAccounts, setCashAccounts] = useState([
    { id: 1, name: 'Merkez TL Kasası', currency: 'TL', code: 'KAS-01', isActive: true, isDefault: true },
    { id: 2, name: 'Merkez Dolar Kasası (USD)', currency: 'USD', code: 'KAS-02', isActive: true, isDefault: false },
    { id: 3, name: 'Merkez Euro Kasası (EUR)', currency: 'EUR', code: 'KAS-03', isActive: true, isDefault: false },
    { id: 4, name: 'Garanti BBVA Şirket Hesabı', currency: 'TL', code: 'BNK-01', isActive: true, isDefault: false },
    { id: 5, name: 'İş Bankası Ticari Hesap', currency: 'TL', code: 'BNK-02', isActive: true, isDefault: false }
  ]);
  const [draftCashAccount, setDraftCashAccount] = useState<{ name: string; currency: string; code: string }>({ name: '', currency: 'TL', code: '' });
  const [editingCashAccount, setEditingCashAccount] = useState<any | null>(null);

  // 5. MASRAF PARAMETRELERİ (Access Kasa_Kategori Tam Listesi)
  const INITIAL_EXPENSE_CATEGORIES = [
    { id: 0, kategoriNo: 0, name: 'TÜRKLER TARIM ANA KSA GİRİŞİ', code: 'MSR-00', vatRate: 20, isDriverExpense: false },
    { id: 1, kategoriNo: 1, name: 'MUTFAK', code: 'MSR-01', vatRate: 20, isDriverExpense: true },
    { id: 2, kategoriNo: 2, name: 'KARGO', code: 'MSR-02', vatRate: 20, isDriverExpense: true },
    { id: 8, kategoriNo: 8, name: 'TAKSİT', code: 'MSR-08', vatRate: 0, isDriverExpense: false },
    { id: 9, kategoriNo: 9, name: 'AİDAT KAPICI', code: 'MSR-09', vatRate: 0, isDriverExpense: false },
    { id: 10, kategoriNo: 10, name: 'GENEL', code: 'MSR-10', vatRate: 20, isDriverExpense: false },
    { id: 11, kategoriNo: 11, name: 'DÜKAN HARÇAMA', code: 'MSR-11', vatRate: 20, isDriverExpense: false },
    { id: 12, kategoriNo: 12, name: 'MARŞANDİZ', code: 'MSR-12', vatRate: 20, isDriverExpense: true },
    { id: 13, kategoriNo: 13, name: 'VAKIFBANK', code: 'MSR-13', vatRate: 0, isDriverExpense: false },
    { id: 14, kategoriNo: 14, name: 'EMANET', code: 'MSR-14', vatRate: 0, isDriverExpense: false },
    { id: 15, kategoriNo: 15, name: 'KOMİSYON', code: 'MSR-15', vatRate: 20, isDriverExpense: true },
    { id: 16, kategoriNo: 16, name: 'SÖZLEŞMELİ ARAÇLAR', code: 'MSR-16', vatRate: 20, isDriverExpense: false },
    { id: 17, kategoriNo: 17, name: 'NOTER TRAFİK', code: 'MSR-17', vatRate: 0, isDriverExpense: false },
    { id: 18, kategoriNo: 18, name: 'ŞÖFÖR MAAŞI', code: 'MSR-18', vatRate: 0, isDriverExpense: true },
    { id: 19, kategoriNo: 19, name: 'ARAÇ BAKIM VE YAKIT', code: 'MSR-19', vatRate: 20, isDriverExpense: true },
    { id: 21, kategoriNo: 21, name: 'ZİRAAT BANK', code: 'MSR-21', vatRate: 0, isDriverExpense: false },
    { id: 22, kategoriNo: 22, name: 'ŞİRKET GİDERİ', code: 'MSR-22', vatRate: 20, isDriverExpense: false },
    { id: 47, kategoriNo: 47, name: 'İŞ TAKİPÇİSİ', code: 'MSR-47', vatRate: 20, isDriverExpense: false },
    { id: 48, kategoriNo: 48, name: 'TELEKOM', code: 'MSR-48', vatRate: 20, isDriverExpense: false },
    { id: 50, kategoriNo: 50, name: 'BORÇ', code: 'MSR-50', vatRate: 0, isDriverExpense: false },
    { id: 51, kategoriNo: 51, name: 'ÖDEME', code: 'MSR-51', vatRate: 0, isDriverExpense: false },
    { id: 59, kategoriNo: 59, name: 'İŞBANKASI', code: 'MSR-59', vatRate: 0, isDriverExpense: false },
    { id: 60, kategoriNo: 60, name: 'GARANTİ', code: 'MSR-60', vatRate: 0, isDriverExpense: false },
    { id: 61, kategoriNo: 61, name: 'DENİZBANK', code: 'MSR-61', vatRate: 0, isDriverExpense: false },
    { id: 62, kategoriNo: 62, name: 'ARAÇLAR', code: 'MSR-62', vatRate: 20, isDriverExpense: true },
    { id: 63, kategoriNo: 63, name: 'SSK primi', code: 'MSR-63', vatRate: 0, isDriverExpense: false },
    { id: 64, kategoriNo: 64, name: 'EV GİDERİ', code: 'MSR-64', vatRate: 20, isDriverExpense: false },
    { id: 65, kategoriNo: 65, name: 'SERKAN TÜRK', code: 'MSR-65', vatRate: 0, isDriverExpense: false },
    { id: 66, kategoriNo: 66, name: 'NECAT TÜRK', code: 'MSR-66', vatRate: 0, isDriverExpense: false },
    { id: 67, kategoriNo: 67, name: 'RÜSTEM TÜRK', code: 'MSR-67', vatRate: 0, isDriverExpense: false },
    { id: 68, kategoriNo: 68, name: 'SARIKAYA NAKLİYAT', code: 'MSR-68', vatRate: 20, isDriverExpense: true },
    { id: 69, kategoriNo: 69, name: 'DÜK EV FATURALAR', code: 'MSR-69', vatRate: 20, isDriverExpense: false },
    { id: 70, kategoriNo: 70, name: 'MISIR GELİRİ', code: 'MSR-70', vatRate: 20, isDriverExpense: false },
    { id: 71, kategoriNo: 71, name: 'NUSAYBİN DÜKAN GELİRİ', code: 'MSR-71', vatRate: 20, isDriverExpense: false },
    { id: 72, kategoriNo: 72, name: 'ŞİRKET GELİRİ', code: 'MSR-72', vatRate: 20, isDriverExpense: false },
    { id: 73, kategoriNo: 73, name: 'PERSONEL GİDERİ', code: 'MSR-73', vatRate: 0, isDriverExpense: false },
    { id: 74, kategoriNo: 74, name: 'FATURA GİDERİ', code: 'MSR-74', vatRate: 20, isDriverExpense: false },
    { id: 75, kategoriNo: 75, name: 'DÜKKAN KİRASI', code: 'MSR-75', vatRate: 20, isDriverExpense: false },
    { id: 76, kategoriNo: 76, name: 'DAİRE TOKİ TAKSİT', code: 'MSR-76', vatRate: 0, isDriverExpense: false }
  ];

  const [expenseCategories, setExpenseCategories] = useState(() => {
    const saved = localStorage.getItem('diza_expense_categories');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSE_CATEGORIES;
  });

  useEffect(() => {
    localStorage.setItem('diza_expense_categories', JSON.stringify(expenseCategories));
  }, [expenseCategories]);

  const [expenseSearchTerm, setExpenseSearchTerm] = useState<string>('');
  const [draftExpense, setDraftExpense] = useState<{ kategoriNo: number; name: string; code: string; vatRate: number; isDriverExpense: boolean }>({
    kategoriNo: 77,
    name: '',
    code: '',
    vatRate: 20,
    isDriverExpense: true
  });
  const [editingExpense, setEditingExpense] = useState<any | null>(null);

  // 6. FATURA PARAMETRELERİ
  const [invoiceVatRates, setInvoiceVatRates] = useState([
    { id: 1, name: '%20 Genel KDV', rate: 20, isDefault: true },
    { id: 2, name: '%10 İndirimli KDV', rate: 10, isDefault: false },
    { id: 3, name: '%0 KDV İstisnası', rate: 0, isDefault: false }
  ]);

  const [withholdingRates, setWithholdingRates] = useState([
    { id: 1, name: '5/10 Taşımacılık Tevkifatı (Varsayılan)', numerator: 5, denominator: 10, code: '624', isDefault: true },
    { id: 2, name: '7/10 İşgücü / Hizmet Tevkifatı', numerator: 7, denominator: 10, code: '601', isDefault: false },
    { id: 3, name: '9/10 Temizlik / Güvenlik', numerator: 9, denominator: 10, code: '602', isDefault: false },
    { id: 4, name: '4/10 Özel İmalat', numerator: 4, denominator: 10, code: '604', isDefault: false },
    { id: 5, name: 'Tevkifatsız (Tam KDV)', numerator: 0, denominator: 10, code: '000', isDefault: false }
  ]);
  const [editingWithholding, setEditingWithholding] = useState<any | null>(null);

  // Cinsi Düzenleme / Silme
  const handleSaveEditCinsi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCinsi || !editingCinsi.name.trim()) return;
    setCinsiList(prev => prev.map(c => (c.id === editingCinsi.id ? { ...c, name: editingCinsi.name.toUpperCase() } : c)));
    setEditingCinsi(null);
    setSaveMessage('✓ Cins başarıyla güncellendi.');
    setTimeout(() => setSaveMessage(null), 2500);
  };

  const handleDeleteCinsi = (id: number) => {
    setCinsiList(prev => prev.filter(c => c.id !== id));
  };

  const handleDraftCinsiChange = (val: string) => {
    if (val.trim()) {
      const nextId = cinsiList.length > 0 ? Math.max(...cinsiList.map(c => c.id)) + 1 : 1;
      setCinsiList(prev => [...prev, { id: nextId, name: val.toUpperCase() }]);
      setDraftCinsi('');
      setSaveMessage(`✓ "${val.toUpperCase()}" cinsi listeye eklendi.`);
      setTimeout(() => setSaveMessage(null), 2500);
    } else {
      setDraftCinsi(val);
    }
  };

  // Kasa Düzenleme / Ekleme
  const handleSaveEditCash = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCashAccount || !editingCashAccount.name.trim()) return;
    setCashAccounts(prev => prev.map(c => (c.id === editingCashAccount.id ? { ...editingCashAccount } : c)));
    setEditingCashAccount(null);
    setSaveMessage('✓ Kasa hesabı güncellendi.');
    setTimeout(() => setSaveMessage(null), 2500);
  };

  const handleAddCashAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftCashAccount.name.trim()) return;
    const nextId = cashAccounts.length + 1;
    setCashAccounts(prev => [
      ...prev,
      {
        id: nextId,
        name: draftCashAccount.name,
        currency: draftCashAccount.currency || 'TL',
        code: draftCashAccount.code || `KAS-0${nextId}`,
        isActive: true,
        isDefault: false
      }
    ]);
    setDraftCashAccount({ name: '', currency: 'TL', code: '' });
    setSaveMessage('✓ Kasa hesabı eklendi.');
    setTimeout(() => setSaveMessage(null), 2500);
  };

  // Masraf Düzenleme / Ekleme
  const handleSaveEditExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense || !editingExpense.name.trim()) return;
    setExpenseCategories(prev =>
      prev.map(item =>
        item.id === editingExpense.id
          ? { ...editingExpense, name: editingExpense.name.toUpperCase(), kategoriNo: Number(editingExpense.kategoriNo ?? editingExpense.id) }
          : item
      )
    );
    setEditingExpense(null);
    setSaveMessage('✓ Masraf kalemi güncellendi.');
    setTimeout(() => setSaveMessage(null), 2500);
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftExpense.name.trim()) return;
    const katNo = Number(draftExpense.kategoriNo) || (expenseCategories.length > 0 ? Math.max(...expenseCategories.map(c => (c as any).kategoriNo ?? c.id)) + 1 : 1);
    const nextId = expenseCategories.length > 0 ? Math.max(...expenseCategories.map(c => c.id)) + 1 : 1;
    setExpenseCategories(prev => [
      ...prev,
      {
        id: nextId,
        kategoriNo: katNo,
        name: draftExpense.name.toUpperCase(),
        code: draftExpense.code || `MSR-${katNo < 10 ? '0' + katNo : katNo}`,
        vatRate: Number(draftExpense.vatRate) || 20,
        isDriverExpense: draftExpense.isDriverExpense
      }
    ]);
    setDraftExpense({ kategoriNo: katNo + 1, name: '', code: '', vatRate: 20, isDriverExpense: true });
    setSaveMessage('✓ Masraf kalemi eklendi.');
    setTimeout(() => setSaveMessage(null), 2500);
  };

  // Tevkifat Düzenleme
  const handleSaveEditWithholding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWithholding) return;
    setWithholdingRates(prev => prev.map(w => (w.id === editingWithholding.id ? { ...editingWithholding } : w)));
    setEditingWithholding(null);
    setSaveMessage('✓ Tevkifat oranı güncellendi.');
    setTimeout(() => setSaveMessage(null), 2500);
  };

  // Sipariş Satırı Güncelleme / Silme
  const handleUpdateOrderRow = (rowId: number, field: keyof OrderParamRow, val: any) => {
    setOrderParamRows(prev =>
      prev.map(r => {
        if (r.id === rowId) {
          const u = { ...r, [field]: val };
          if (field === 'buyPrice' || field === 'sellPrice') {
            const buy = Number(u.buyPrice) || 0;
            const sell = Number(u.sellPrice) || 0;
            if (sell > buy) u.commission = (sell - buy) * 100;
          }
          return u;
        }
        return r;
      })
    );
  };

  const handleDeleteOrderRow = (rowId: number) => {
    setOrderParamRows(prev => prev.filter(r => r.id !== rowId));
  };

  const handleDraftOrderChange = (field: keyof OrderParamRow, val: any) => {
    const updatedDraft = { ...draftOrderRow, [field]: val };

    const hasContent =
      (field === 'loadTitle' && val) ||
      (field === 'company' && val) ||
      (field === 'transporter' && val) ||
      (field === 'unloadingPlace' && val) ||
      (field === 'goodsType' && val) ||
      (field === 'buyPrice' && val) ||
      (field === 'sellPrice' && val);

    if (hasContent) {
      const nextId = Date.now();
      const nextSipId = String(orderParamRows.length + 1);

      const buy = Number(updatedDraft.buyPrice) || 0;
      const sell = Number(updatedDraft.sellPrice) || 0;
      const comm = (sell - buy) > 0 ? (sell - buy) * 100 : Number(updatedDraft.commission) || 0;

      const newRow: OrderParamRow = {
        id: nextId,
        sip_id: nextSipId,
        show: updatedDraft.show ?? true,
        loadTitle: updatedDraft.loadTitle || '',
        company: updatedDraft.company || 'ETİ BAKIR',
        transporter: updatedDraft.transporter || 'TÜRKLER NAKLİYAT',
        intermediary: updatedDraft.intermediary || 'TÜRKLER NAK',
        loadingPlace: updatedDraft.loadingPlace || 'ETİ BAKIR',
        unloadingPlace: updatedDraft.unloadingPlace || 'MARDİN',
        unloadingDistrict: updatedDraft.unloadingDistrict || 'MERKEZ',
        goodsType: updatedDraft.goodsType || '',
        quantity: updatedDraft.quantity,
        buyPrice: updatedDraft.buyPrice,
        sellPrice: updatedDraft.sellPrice,
        vatRate: Number(updatedDraft.vatRate) || 20,
        commission: comm,
        dispatchAddress: updatedDraft.dispatchAddress || '',
        orderDate: updatedDraft.orderDate || '',
        orderSeqNo: updatedDraft.orderSeqNo || '',
        orderProduct: updatedDraft.orderProduct || '',
        orderCustomer: updatedDraft.orderCustomer || ''
      };

      setOrderParamRows(prev => [...prev, newRow]);

      setDraftOrderRow({
        sip_id: 'Yeni',
        show: true,
        loadTitle: '',
        company: '',
        transporter: '',
        intermediary: '',
        loadingPlace: 'ETİ BAKIR',
        unloadingPlace: 'MARDİN',
        unloadingDistrict: 'MERKEZ',
        goodsType: '',
        quantity: undefined,
        buyPrice: undefined,
        sellPrice: undefined,
        vatRate: 20,
        commission: undefined,
        dispatchAddress: '',
        orderDate: '',
        orderSeqNo: '',
        orderProduct: '',
        orderCustomer: ''
      });

      setSaveMessage('✓ Yeni sipariş/yük parametresi eklendi.');
      setTimeout(() => setSaveMessage(null), 2500);
    } else {
      setDraftOrderRow(updatedDraft);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Gizli Dosya Seçici (Logo Yükleme) */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleLogoUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />

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

      {/* 1. DİZA PARAMETRE BUTONLARI (Şirket Bilgileri, CİNSİ, Sipariş, Kasa, Masraf, Fatura) */}
      <div
        className="glass-card scrollable-tabs-bar"
        style={{
          padding: '12px 18px',
          background: '#ffffff',
          borderLeft: '4px solid var(--diza-red)'
        }}
      >
        {/* 1. Şirket Bilgileri (İsmi sadeleştirildi) */}
        <button
          type="button"
          onClick={() => setActiveSubTab('company')}
          style={{
            padding: '10px 20px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 900,
            fontSize: 13,
            border: activeSubTab === 'company' ? '2px solid var(--diza-red)' : '1px solid var(--border-color)',
            background: activeSubTab === 'company' ? 'var(--diza-red)' : '#ffffff',
            color: activeSubTab === 'company' ? '#ffffff' : '#0f172a',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: activeSubTab === 'company' ? 'var(--shadow-md)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <Building size={16} />
          Şirket Bilgileri
        </button>

        {/* 2. CİNSİ */}
        <button
          type="button"
          onClick={() => setActiveSubTab('cinsi')}
          style={{
            padding: '10px 20px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 900,
            fontSize: 13,
            border: activeSubTab === 'cinsi' ? '2px solid var(--diza-red)' : '1px solid var(--border-color)',
            background: activeSubTab === 'cinsi' ? 'var(--diza-red)' : '#ffffff',
            color: activeSubTab === 'cinsi' ? '#ffffff' : '#0f172a',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: activeSubTab === 'cinsi' ? 'var(--shadow-md)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <Tag size={16} />
          CİNSİ
        </button>

        {/* 3. Sipariş ve Sevkiyat */}
        <button
          type="button"
          onClick={() => setActiveSubTab('orders')}
          style={{
            padding: '10px 20px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 900,
            fontSize: 13,
            border: activeSubTab === 'orders' ? '2px solid var(--diza-red)' : '1px solid var(--border-color)',
            background: activeSubTab === 'orders' ? 'var(--diza-red)' : '#ffffff',
            color: activeSubTab === 'orders' ? '#ffffff' : '#0f172a',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: activeSubTab === 'orders' ? 'var(--shadow-md)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <Package size={16} />
          Sipariş ve Sevkiyat
        </button>

        {/* 4. Kasa Parametreleri */}
        <button
          type="button"
          onClick={() => setActiveSubTab('cash')}
          style={{
            padding: '10px 20px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 900,
            fontSize: 13,
            border: activeSubTab === 'cash' ? '2px solid var(--diza-red)' : '1px solid var(--border-color)',
            background: activeSubTab === 'cash' ? 'var(--diza-red)' : '#ffffff',
            color: activeSubTab === 'cash' ? '#ffffff' : '#0f172a',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: activeSubTab === 'cash' ? 'var(--shadow-md)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <Wallet size={16} />
          Kasa Parametreleri
        </button>

        {/* 5. Masraf Parametreleri */}
        <button
          type="button"
          onClick={() => setActiveSubTab('expenses')}
          style={{
            padding: '10px 20px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 900,
            fontSize: 13,
            border: activeSubTab === 'expenses' ? '2px solid var(--diza-red)' : '1px solid var(--border-color)',
            background: activeSubTab === 'expenses' ? 'var(--diza-red)' : '#ffffff',
            color: activeSubTab === 'expenses' ? '#ffffff' : '#0f172a',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: activeSubTab === 'expenses' ? 'var(--shadow-md)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <Receipt size={16} />
          Masraf Parametreleri
        </button>

        {/* 6. Fatura Parametreleri */}
        <button
          type="button"
          onClick={() => setActiveSubTab('invoices')}
          style={{
            padding: '10px 20px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 900,
            fontSize: 13,
            border: activeSubTab === 'invoices' ? '2px solid var(--diza-red)' : '1px solid var(--border-color)',
            background: activeSubTab === 'invoices' ? 'var(--diza-red)' : '#ffffff',
            color: activeSubTab === 'invoices' ? '#ffffff' : '#0f172a',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: activeSubTab === 'invoices' ? 'var(--shadow-md)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <FileText size={16} />
          Fatura Parametreleri
        </button>
      </div>

      {/* 2. ŞİRKET BİLGİLERİ (Gelişmiş Logo Yükleme / Değiştirme / Silme) */}
      {activeSubTab === 'company' && (
        <form onSubmit={handleSaveCompanySettings} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            className="glass-card"
            style={{
              padding: '24px',
              background: '#ffffff',
              border: '1.5px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: 18
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border-color)', paddingBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  Resmî Şirket Bilgileri
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                  Faturalarda, zarf baskılarında, ekstre ve resmi evraklarda çıkan gönderici şirket tanımları
                </p>
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: '9px 24px', fontWeight: 900, fontSize: 13 }}>
                <Save size={16} /> Değişiklikleri Kaydet
              </button>
            </div>

            {/* 1. Satır: Logo Yönetimi ve Şirket Ünvanı */}
            <div className="responsive-grid-2" style={{ alignItems: 'center' }}>
              {/* Logo Alanı (Yükle / Değiştir / Sil Butonları) */}
              <div
                style={{
                  border: '2px dashed var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 14,
                  textAlign: 'center',
                  background: '#f8fafc',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10
                }}
              >
                {companySettings.logoUrl ? (
                  <div style={{ position: 'relative' }}>
                    <img
                      src={companySettings.logoUrl}
                      alt="Firma Logosu"
                      style={{
                        width: 160,
                        height: 75,
                        objectFit: 'contain',
                        borderRadius: 6,
                        background: '#ffffff',
                        border: '1.5px solid #cbd5e1',
                        padding: 6
                      }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      width: 160,
                      height: 75,
                      borderRadius: 6,
                      background: '#e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-muted)',
                      fontSize: 11,
                      fontWeight: 800
                    }}
                  >
                    Logo Eklenmemiş
                  </div>
                )}

                {/* Logo Aksiyon Butonları */}
                <div style={{ display: 'flex', gap: 6, width: '100%' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ flex: 1, fontSize: 11, fontWeight: 800, padding: '5px 8px', color: '#1d4ed8' }}
                    title="Bilgisayardan Logo Yükle veya Değiştir"
                  >
                    <Upload size={13} /> {companySettings.logoUrl ? 'Değiştir' : 'Logo Ekle'}
                  </button>

                  {companySettings.logoUrl && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleDeleteLogo}
                      style={{ fontSize: 11, padding: '5px 8px', color: '#ef4444' }}
                      title="Logoyu Kaldır / Sil"
                    >
                      <Trash2 size={13} /> Sil
                    </button>
                  )}
                </div>
              </div>

              {/* Ünvan ve Marka */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: 11, fontWeight: 900, color: '#1e293b', textTransform: 'uppercase' }}>
                    RESMÎ ŞİRKET TİCARİ ÜNVANI
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={companySettings.companyName}
                    onChange={e => setCompanySettings({ ...companySettings, companyName: e.target.value })}
                    style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}
                    required
                  />
                </div>

                <div className="responsive-grid-2">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: 11, fontWeight: 900, color: '#1e293b', textTransform: 'uppercase' }}>
                      MARKA / KISA AD
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={companySettings.brandName}
                      onChange={e => setCompanySettings({ ...companySettings, brandName: e.target.value })}
                      style={{ fontWeight: 800, color: 'var(--diza-red)' }}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: 11, fontWeight: 900, color: '#1e293b', textTransform: 'uppercase' }}>
                      YETKİLİ / İMZA YETKİLİSİ
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={companySettings.authorizedPerson}
                      onChange={e => setCompanySettings({ ...companySettings, authorizedPerson: e.target.value })}
                      style={{ fontWeight: 700 }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Satır: İl, İlçe, Adres */}
            <div className="responsive-grid-3">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 11, fontWeight: 900, color: '#1e293b', textTransform: 'uppercase' }}>
                  İL (ŞEHİR)
                </label>
                <select
                  className="form-control"
                  value={companySettings.city}
                  onChange={e => setCompanySettings({ ...companySettings, city: e.target.value, district: TURKEY_CITIES_DISTRICTS[e.target.value]?.[0] || 'Merkez' })}
                  style={{ fontWeight: 800 }}
                >
                  {CITIES_LIST.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 11, fontWeight: 900, color: '#1e293b', textTransform: 'uppercase' }}>
                  İLÇE
                </label>
                <select
                  className="form-control"
                  value={companySettings.district}
                  onChange={e => setCompanySettings({ ...companySettings, district: e.target.value })}
                  style={{ fontWeight: 800 }}
                >
                  {availableCompanyDistricts.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 11, fontWeight: 900, color: '#1e293b', textTransform: 'uppercase' }}>
                  MERKEZ ADRESİ
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={companySettings.address}
                  onChange={e => setCompanySettings({ ...companySettings, address: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* 3. Satır: Telefonlar ve İletişim */}
            <div className="responsive-grid-4">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 11, fontWeight: 900, color: '#1e293b', textTransform: 'uppercase' }}>
                  SABİT TELEFON
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={companySettings.phone}
                  onChange={e => setCompanySettings({ ...companySettings, phone: formatPhoneNumber(e.target.value) })}
                  style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 11, fontWeight: 900, color: '#1e293b', textTransform: 'uppercase' }}>
                  GSM / MOBİL
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={companySettings.gsmPhone}
                  onChange={e => setCompanySettings({ ...companySettings, gsmPhone: formatPhoneNumber(e.target.value) })}
                  style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 11, fontWeight: 900, color: '#1e293b', textTransform: 'uppercase' }}>
                  FAX / BELGEGEÇER
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={companySettings.fax}
                  onChange={e => setCompanySettings({ ...companySettings, fax: formatPhoneNumber(e.target.value) })}
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 11, fontWeight: 900, color: '#1e293b', textTransform: 'uppercase' }}>
                  E-POSTA
                </label>
                <input
                  type="email"
                  className="form-control"
                  value={companySettings.email}
                  onChange={e => setCompanySettings({ ...companySettings, email: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* 4. Satır: Vergi, Ticaret Sicil ve Mersis */}
            <div className="responsive-grid-4">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 11, fontWeight: 900, color: '#1e293b', textTransform: 'uppercase' }}>
                  VERGİ DAİRESİ
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={companySettings.taxOffice}
                  onChange={e => setCompanySettings({ ...companySettings, taxOffice: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 11, fontWeight: 900, color: '#1e293b', textTransform: 'uppercase' }}>
                  VERGİ NUMARASI / TCKN
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={companySettings.taxNumber}
                  onChange={e => setCompanySettings({ ...companySettings, taxNumber: e.target.value })}
                  style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 11, fontWeight: 900, color: '#1e293b', textTransform: 'uppercase' }}>
                  TİCARET SİCİL NO
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={companySettings.tradeRegistryNo}
                  onChange={e => setCompanySettings({ ...companySettings, tradeRegistryNo: e.target.value })}
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 11, fontWeight: 900, color: '#1e293b', textTransform: 'uppercase' }}>
                  MERSİS NUMARASI
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={companySettings.mersisNo}
                  onChange={e => setCompanySettings({ ...companySettings, mersisNo: e.target.value })}
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
              </div>
            </div>

            {/* 5. Satır: IBAN Bilgileri */}
            <div className="responsive-grid-3">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 11, fontWeight: 900, color: '#1e293b', textTransform: 'uppercase' }}>
                  TL BANKA HESABI (IBAN)
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={companySettings.ibanTL}
                  onChange={e => setCompanySettings({ ...companySettings, ibanTL: e.target.value })}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 11, fontWeight: 900, color: '#1e293b', textTransform: 'uppercase' }}>
                  USD BANKA HESABI (IBAN)
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={companySettings.ibanUSD}
                  onChange={e => setCompanySettings({ ...companySettings, ibanUSD: e.target.value })}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 11, fontWeight: 900, color: '#1e293b', textTransform: 'uppercase' }}>
                  EUR BANKA HESABI (IBAN)
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={companySettings.ibanEUR}
                  onChange={e => setCompanySettings({ ...companySettings, ibanEUR: e.target.value })}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}
                />
              </div>
            </div>

            {/* Fatura Alt Notu */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: 11, fontWeight: 900, color: '#1e293b', textTransform: 'uppercase' }}>
                FATURA & İRSALİYE ALTI RESMÎ NOTU
              </label>
              <textarea
                className="form-control"
                rows={2}
                value={companySettings.invoiceNote}
                onChange={e => setCompanySettings({ ...companySettings, invoiceNote: e.target.value })}
              />
            </div>
          </div>
        </form>
      )}

      {/* 3. CİNSİ PARAMETRELERİ */}
      {activeSubTab === 'cinsi' && (
        <div
          className="glass-card"
          style={{
            padding: 0,
            background: '#ffffff',
            overflow: 'hidden',
            border: '1.5px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)',
            maxWidth: 720
          }}
        >
          <div
            style={{
              padding: '12px 18px',
              background: '#f1f5f9',
              borderBottom: '1.5px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Tag size={18} color="var(--diza-red)" />
              <div>
                <strong style={{ fontSize: 14, color: '#0f172a' }}>
                  YÜK CİNSİ TANIMLARI ({cinsiList.length} Kayıt)
                </strong>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                  Sipariş ve sevkiyat ekranlarındaki "Cinsi" seçim listesi
                </p>
              </div>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
              * Doğrudan metne tıklayıp düzeltebilirsiniz
            </span>
          </div>

          <div style={{ overflowX: 'auto', maxHeight: '520px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#7092be', color: '#ffffff', borderBottom: '2px solid #476891' }}>
                  <th style={{ padding: '8px 12px', width: 60, textAlign: 'center', borderRight: '1px solid #94a3b8' }}>S.No</th>
                  <th style={{ padding: '8px 14px', textAlign: 'left', borderRight: '1px solid #94a3b8' }}>Cinsi (Mal / Ürün Adı)</th>
                  <th style={{ padding: '8px 12px', width: 100, textAlign: 'center' }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {cinsiList.map((c, idx) => (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: '1px solid #e2e8f0',
                      background: idx % 2 === 1 ? '#f8fafc' : '#ffffff'
                    }}
                  >
                    <td style={{ padding: '6px 12px', textAlign: 'center', borderRight: '1px solid #e2e8f0', fontWeight: 800, color: 'var(--diza-red)', fontFamily: 'var(--font-mono)' }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: '4px 10px', borderRight: '1px solid #e2e8f0' }}>
                      <input
                        type="text"
                        value={c.name}
                        onChange={e => {
                          const val = e.target.value.toUpperCase();
                          setCinsiList(prev => prev.map(item => item.id === c.id ? { ...item, name: val } : item));
                        }}
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          border: '1px solid transparent',
                          borderRadius: 4,
                          fontSize: 13,
                          fontWeight: 800,
                          color: '#0f172a',
                          background: 'transparent',
                          fontFamily: 'inherit'
                        }}
                        onFocus={e => (e.target.style.border = '1px solid var(--diza-red)')}
                        onBlur={e => (e.target.style.border = '1px solid transparent')}
                      />
                    </td>
                    <td style={{ padding: '4px 10px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => setEditingCinsi(c)}
                          style={{ background: 'none', border: 'none', color: '#1d4ed8', cursor: 'pointer', padding: 4 }}
                          title="Düzelt"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCinsi(c.id)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}
                          title="Sil"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Boş Taslak Satırı */}
                <tr style={{ background: '#fef2f2', borderTop: '2px dashed #fca5a5' }}>
                  <td style={{ padding: '6px 12px', textAlign: 'center', borderRight: '1px solid #e2e8f0', fontWeight: 900, color: 'var(--diza-red)', fontFamily: 'var(--font-mono)' }}>
                    *
                  </td>
                  <td style={{ padding: '4px 10px', borderRight: '1px solid #e2e8f0' }}>
                    <input
                      type="text"
                      value={draftCinsi}
                      onChange={e => setDraftCinsi(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleDraftCinsiChange(draftCinsi);
                      }}
                      onBlur={() => {
                        if (draftCinsi.trim()) handleDraftCinsiChange(draftCinsi);
                      }}
                      placeholder="Yeni Cins Yazıp Enter'a basınız (Örn: HURDA, MERMER...)"
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        border: '1.5px solid var(--diza-red)',
                        borderRadius: 4,
                        fontSize: 13,
                        fontWeight: 800,
                        color: 'var(--diza-red)',
                        background: '#ffffff'
                      }}
                    />
                  </td>
                  <td style={{ padding: '4px 10px', textAlign: 'center', color: 'var(--text-dim)' }}>
                    *
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. SİPARİŞ VE SEVKİYAT PARAMETRELERİ */}
      {activeSubTab === 'orders' && (
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
          <div
            style={{
              padding: '10px 16px',
              background: '#f1f5f9',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <strong style={{ fontSize: 13, color: '#0f172a' }}>
                Sipariş ve Sevkiyat Parametre Tanımları ({orderParamRows.length} Kayıt)
              </strong>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                Hücrelere doğrudan tıklayarak bilgileri güncelleyebilir, en alta yazarak yeni satır açabilirsiniz.
              </p>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
              * Otomatik kaydetme devrededir
            </span>
          </div>

          <div className="desktop-only-table" style={{ overflowX: 'auto', maxHeight: '480px' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 11,
                whiteSpace: 'nowrap'
              }}
            >
              <thead>
                <tr style={{ background: '#7092be', color: '#ffffff', borderBottom: '2px solid #476891' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid #94a3b8' }}>sip_id</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid #94a3b8' }}>Göster</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', borderRight: '1px solid #94a3b8' }}>Yükün Tanımı</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', borderRight: '1px solid #94a3b8' }}>Firma</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', borderRight: '1px solid #94a3b8' }}>Nakliyeci</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', borderRight: '1px solid #94a3b8' }}>Aracı</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', borderRight: '1px solid #94a3b8' }}>Yükleme Yeri</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', borderRight: '1px solid #94a3b8' }}>İndirme Yeri</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', borderRight: '1px solid #94a3b8' }}>İndirme İlçesi</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', borderRight: '1px solid #94a3b8' }}>Cinsi</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', borderRight: '1px solid #94a3b8' }}>Miktar</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', borderRight: '1px solid #94a3b8' }}>AL_Fiyat</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', borderRight: '1px solid #94a3b8' }}>Sat_Fiyat</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid #94a3b8' }}>KDV</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', borderRight: '1px solid #94a3b8' }}>Komisyon</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', borderRight: '1px solid #94a3b8' }}>sevk_adresi</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center' }}>Sil</th>
                </tr>
              </thead>
              <tbody>
                {orderParamRows.map((r, idx) => (
                  <tr
                    key={r.id}
                    style={{
                      borderBottom: '1px solid #e2e8f0',
                      background: idx % 2 === 1 ? '#f8fafc' : '#ffffff'
                    }}
                  >
                    <td style={{ padding: '4px 6px', textAlign: 'center', borderRight: '1px solid #e2e8f0', fontWeight: 900, color: 'var(--diza-red)', fontFamily: 'var(--font-mono)' }}>
                      {r.sip_id}
                    </td>
                    <td style={{ padding: '4px 6px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>
                      <input
                        type="checkbox"
                        checked={r.show}
                        onChange={e => handleUpdateOrderRow(r.id, 'show', e.target.checked)}
                        style={{ cursor: 'pointer', width: 14, height: 14 }}
                      />
                    </td>
                    <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                      <input
                        type="text"
                        value={r.loadTitle}
                        onChange={e => handleUpdateOrderRow(r.id, 'loadTitle', e.target.value)}
                        style={{ width: 90, padding: '3px 4px', border: '1px solid #cbd5e1', borderRadius: 3, fontSize: 11, fontWeight: 800, color: 'var(--diza-red)' }}
                      />
                    </td>
                    {/* Firma (Carilerden Seçim) */}
                    <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                      <select
                        value={r.company || ''}
                        onChange={e => handleUpdateOrderRow(r.id, 'company', e.target.value)}
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

                    {/* Nakliyeci (Carilerden Seçim) */}
                    <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                      <select
                        value={r.transporter || ''}
                        onChange={e => handleUpdateOrderRow(r.id, 'transporter', e.target.value)}
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

                    {/* Aracı (Carilerden Seçim) */}
                    <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                      <select
                        value={r.intermediary || ''}
                        onChange={e => handleUpdateOrderRow(r.id, 'intermediary', e.target.value)}
                        style={{
                          width: 120,
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

                    {/* Yükleme Yeri (81 İl Seçimi) */}
                    <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                      <select
                        value={r.loadingPlace || ''}
                        onChange={e => handleUpdateOrderRow(r.id, 'loadingPlace', e.target.value)}
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
                        {r.loadingPlace && !CITIES_LIST.some(c => c.toLocaleLowerCase('tr') === r.loadingPlace?.toLocaleLowerCase('tr')) && (
                          <option value={r.loadingPlace}>{r.loadingPlace}</option>
                        )}
                        {CITIES_LIST.map(city => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* İndirme Yeri (81 İl Seçimi) */}
                    <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                      <select
                        value={r.unloadingPlace || ''}
                        onChange={e => {
                          const newCity = e.target.value;
                          handleUpdateOrderRow(r.id, 'unloadingPlace', newCity);
                          const dists = getDistrictsByCity(newCity);
                          if (dists.length > 0) {
                            handleUpdateOrderRow(r.id, 'unloadingDistrict', dists[0]);
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
                        {r.unloadingPlace && !CITIES_LIST.some(c => c.toLocaleLowerCase('tr') === r.unloadingPlace?.toLocaleLowerCase('tr')) && (
                          <option value={r.unloadingPlace}>{r.unloadingPlace}</option>
                        )}
                        {CITIES_LIST.map(city => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* İndirme İlçesi (Seçilen İlin İlçeleri) */}
                    <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                      {(() => {
                        const districts = getDistrictsByCity(r.unloadingPlace);
                        return (
                          <select
                            value={r.unloadingDistrict || ''}
                            onChange={e => handleUpdateOrderRow(r.id, 'unloadingDistrict', e.target.value)}
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
                        onChange={e => handleUpdateOrderRow(r.id, 'goodsType', e.target.value)}
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
                        {r.goodsType && !cinsiList.some(c => c.name.toLocaleLowerCase('tr') === r.goodsType?.toLocaleLowerCase('tr')) && (
                          <option value={r.goodsType}>{r.goodsType}</option>
                        )}
                        {cinsiList.map(c => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                      <input
                        type="number"
                        step="0.01"
                        value={r.quantity !== undefined ? r.quantity : ''}
                        onChange={e => handleUpdateOrderRow(r.id, 'quantity', Number(e.target.value))}
                        style={{ width: 60, textAlign: 'right', padding: '3px 4px', border: '1px solid #cbd5e1', borderRadius: 3, fontSize: 11 }}
                      />
                    </td>
                    <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                      <input
                        type="number"
                        step="0.01"
                        value={r.buyPrice !== undefined ? r.buyPrice : ''}
                        onChange={e => handleUpdateOrderRow(r.id, 'buyPrice', Number(e.target.value))}
                        style={{ width: 70, textAlign: 'right', padding: '3px 4px', border: '1px solid #cbd5e1', borderRadius: 3, fontSize: 11, fontFamily: 'var(--font-mono)' }}
                      />
                    </td>
                    <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                      <input
                        type="number"
                        step="0.01"
                        value={r.sellPrice !== undefined ? r.sellPrice : ''}
                        onChange={e => handleUpdateOrderRow(r.id, 'sellPrice', Number(e.target.value))}
                        style={{ width: 70, textAlign: 'right', padding: '3px 4px', border: '1px solid #cbd5e1', borderRadius: 3, fontSize: 11, fontFamily: 'var(--font-mono)' }}
                      />
                    </td>
                    <td style={{ padding: '2px 4px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>
                      <select
                        value={r.vatRate !== undefined ? r.vatRate : defaultVatRate}
                        onChange={e => handleUpdateOrderRow(r.id, 'vatRate', Number(e.target.value))}
                        style={{
                          padding: '3px 4px',
                          border: '1px solid #cbd5e1',
                          borderRadius: 3,
                          fontSize: 11,
                          fontWeight: 800,
                          color: '#1d4ed8',
                          background: '#ffffff',
                          cursor: 'pointer'
                        }}
                      >
                        {vatRates.map(v => (
                          <option key={v.id} value={v.rate}>%{v.rate}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '4px 8px', textAlign: 'right', borderRight: '1px solid #e2e8f0', color: '#1d4ed8', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>
                      {Number(r.commission || 0).toLocaleString('tr-TR')}
                    </td>
                    <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                      <input
                        type="text"
                        value={r.dispatchAddress || ''}
                        onChange={e => handleUpdateOrderRow(r.id, 'dispatchAddress', e.target.value)}
                        style={{ width: 100, padding: '3px 4px', border: '1px solid #cbd5e1', borderRadius: 3, fontSize: 11 }}
                      />
                    </td>
                    <td style={{ padding: '2px 4px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleDeleteOrderRow(r.id)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}
                        title="Satırı Sil"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Boş Taslak Satırı */}
                <tr style={{ background: '#fef2f2', borderTop: '2px dashed #fca5a5' }}>
                  <td style={{ padding: '4px 6px', textAlign: 'center', borderRight: '1px solid #e2e8f0', fontWeight: 900, color: 'var(--diza-red)', fontFamily: 'var(--font-mono)' }}>
                    *
                  </td>
                  <td style={{ padding: '4px 6px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>
                    <input
                      type="checkbox"
                      checked={draftOrderRow.show}
                      onChange={e => handleDraftOrderChange('show', e.target.checked)}
                      style={{ cursor: 'pointer', width: 14, height: 14 }}
                    />
                  </td>
                  <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                    <input
                      type="text"
                      value={draftOrderRow.loadTitle || ''}
                      onChange={e => handleDraftOrderChange('loadTitle', e.target.value)}
                      placeholder="Yeni Tanım"
                      style={{ width: 90, padding: '3px 4px', border: '1px solid var(--diza-red)', borderRadius: 3, fontSize: 11, fontWeight: 800, color: 'var(--diza-red)' }}
                    />
                  </td>
                  {/* Firma (Carilerden Seçim) */}
                  <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                    <select
                      value={draftOrderRow.company || ''}
                      onChange={e => handleDraftOrderChange('company', e.target.value)}
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
                      {draftOrderRow.company && !customers.some(c => c.name === draftOrderRow.company) && (
                        <option value={draftOrderRow.company}>{draftOrderRow.company}</option>
                      )}
                      {customers.map(c => (
                        <option key={c.id} value={c.name}>
                          [{c.id}] {c.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Nakliyeci (Carilerden Seçim) */}
                  <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                    <select
                      value={draftOrderRow.transporter || ''}
                      onChange={e => handleDraftOrderChange('transporter', e.target.value)}
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
                      {draftOrderRow.transporter && !customers.some(c => c.name === draftOrderRow.transporter) && (
                        <option value={draftOrderRow.transporter}>{draftOrderRow.transporter}</option>
                      )}
                      {customers.map(c => (
                        <option key={c.id} value={c.name}>
                          [{c.id}] {c.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Aracı (Carilerden Seçim) */}
                  <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                    <select
                      value={draftOrderRow.intermediary || ''}
                      onChange={e => handleDraftOrderChange('intermediary', e.target.value)}
                      style={{
                        width: 120,
                        padding: '3px 4px',
                        border: '1px solid #cbd5e1',
                        borderRadius: 3,
                        fontSize: 11,
                        background: '#ffffff',
                        color: '#0f172a'
                      }}
                    >
                      <option value="">-- Aracı Seç --</option>
                      {draftOrderRow.intermediary && !customers.some(c => c.name === draftOrderRow.intermediary) && (
                        <option value={draftOrderRow.intermediary}>{draftOrderRow.intermediary}</option>
                      )}
                      {customers.map(c => (
                        <option key={c.id} value={c.name}>
                          [{c.id}] {c.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Yükleme Yeri (81 İl Seçimi) */}
                  <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                    <select
                      value={draftOrderRow.loadingPlace || ''}
                      onChange={e => handleDraftOrderChange('loadingPlace', e.target.value)}
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
                      {draftOrderRow.loadingPlace && !CITIES_LIST.some(c => c.toLocaleLowerCase('tr') === draftOrderRow.loadingPlace?.toLocaleLowerCase('tr')) && (
                        <option value={draftOrderRow.loadingPlace}>{draftOrderRow.loadingPlace}</option>
                      )}
                      {CITIES_LIST.map(city => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* İndirme Yeri (81 İl Seçimi) */}
                  <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                    <select
                      value={draftOrderRow.unloadingPlace || ''}
                      onChange={e => {
                        const newCity = e.target.value;
                        const dists = getDistrictsByCity(newCity);
                        handleDraftOrderChange('unloadingPlace', newCity);
                        if (dists.length > 0) {
                          setDraftOrderRow(prev => ({ ...prev, unloadingDistrict: dists[0] }));
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
                      {draftOrderRow.unloadingPlace && !CITIES_LIST.some(c => c.toLocaleLowerCase('tr') === draftOrderRow.unloadingPlace?.toLocaleLowerCase('tr')) && (
                        <option value={draftOrderRow.unloadingPlace}>{draftOrderRow.unloadingPlace}</option>
                      )}
                      {CITIES_LIST.map(city => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* İndirme İlçesi (Seçilen İlin İlçeleri) */}
                  <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                    {(() => {
                      const districts = getDistrictsByCity(draftOrderRow.unloadingPlace);
                      return (
                        <select
                          value={draftOrderRow.unloadingDistrict || ''}
                          onChange={e => handleDraftOrderChange('unloadingDistrict', e.target.value)}
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
                          {draftOrderRow.unloadingDistrict && !districts.includes(draftOrderRow.unloadingDistrict) && (
                            <option value={draftOrderRow.unloadingDistrict}>{draftOrderRow.unloadingDistrict}</option>
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
                      value={draftOrderRow.goodsType || ''}
                      onChange={e => handleDraftOrderChange('goodsType', e.target.value)}
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
                      {draftOrderRow.goodsType && !cinsiList.some(c => c.name.toLocaleLowerCase('tr') === draftOrderRow.goodsType?.toLocaleLowerCase('tr')) && (
                        <option value={draftOrderRow.goodsType}>{draftOrderRow.goodsType}</option>
                      )}
                      {cinsiList.map(c => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                    <input
                      type="number"
                      placeholder="Miktar"
                      value={draftOrderRow.quantity !== undefined ? draftOrderRow.quantity : ''}
                      onChange={e => handleDraftOrderChange('quantity', Number(e.target.value))}
                      style={{ width: 60, textAlign: 'right', padding: '3px 4px', border: '1px solid #cbd5e1', borderRadius: 3, fontSize: 11 }}
                    />
                  </td>
                  <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                    <input
                      type="number"
                      placeholder="AL Fiyat"
                      value={draftOrderRow.buyPrice !== undefined ? draftOrderRow.buyPrice : ''}
                      onChange={e => handleDraftOrderChange('buyPrice', Number(e.target.value))}
                      style={{ width: 70, textAlign: 'right', padding: '3px 4px', border: '1px solid #cbd5e1', borderRadius: 3, fontSize: 11 }}
                    />
                  </td>
                  <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                    <input
                      type="number"
                      placeholder="Sat Fiyat"
                      value={draftOrderRow.sellPrice !== undefined ? draftOrderRow.sellPrice : ''}
                      onChange={e => handleDraftOrderChange('sellPrice', Number(e.target.value))}
                      style={{ width: 70, textAlign: 'right', padding: '3px 4px', border: '1px solid #cbd5e1', borderRadius: 3, fontSize: 11 }}
                    />
                  </td>
                  <td style={{ padding: '2px 4px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>
                    <select
                      value={draftOrderRow.vatRate !== undefined ? draftOrderRow.vatRate : defaultVatRate}
                      onChange={e => handleDraftOrderChange('vatRate', Number(e.target.value))}
                      style={{
                        padding: '3px 4px',
                        border: '1px solid var(--diza-red)',
                        borderRadius: 3,
                        fontSize: 11,
                        fontWeight: 800,
                        color: 'var(--diza-red)',
                        background: '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      {vatRates.map(v => (
                        <option key={v.id} value={v.rate}>%{v.rate}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '4px 8px', textAlign: 'right', borderRight: '1px solid #e2e8f0', color: '#1d4ed8' }}>
                    -
                  </td>
                  <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>
                    <input
                      type="text"
                      value={draftOrderRow.dispatchAddress || ''}
                      onChange={e => handleDraftOrderChange('dispatchAddress', e.target.value)}
                      placeholder="Sevk Adresi"
                      style={{ width: 100, padding: '3px 4px', border: '1px solid #cbd5e1', borderRadius: 3, fontSize: 11 }}
                    />
                  </td>
                  <td style={{ padding: '2px 4px', textAlign: 'center', color: 'var(--text-dim)' }}>
                    *
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobilde Dokunmatik Sipariş & Yük Parametre Kartları */}
          <div className="mobile-only-cards" style={{ padding: '12px' }}>
            {orderParamRows.map(r => (
              <div
                key={r.id}
                className="mobile-action-card"
                style={{
                  borderLeft: '4px solid var(--diza-red)'
                }}
              >
                <div className="card-top-row">
                  <span style={{ fontWeight: 900, color: 'var(--diza-red)', fontFamily: 'monospace' }}>
                    Sipariş #{r.sip_id}
                  </span>
                  <span className="card-date-tag">{r.goodsType || 'Emtia'}</span>
                </div>

                <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', margin: '3px 0' }}>
                  {r.loadTitle || 'İsimsiz Yük Tanımı'}
                </div>

                <div style={{ fontSize: 12, color: '#475569' }}>
                  <strong>Firma:</strong> {r.company || '-'}
                </div>

                <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 700, margin: '2px 0' }}>
                  {r.loadingPlace || 'Mersin'} ➔ {r.unloadingPlace || 'Mardin'} ({r.unloadingDistrict || 'Merkez'})
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '6px 10px', borderRadius: 6, margin: '4px 0', fontSize: 11 }}>
                  <span>Miktar: <strong>{r.quantity || 0} Ton</strong></span>
                  <span>Alış: <strong>{r.buyPrice || 0} ₺</strong></span>
                  <span>Satış: <strong>{r.sellPrice || 0} ₺</strong></span>
                </div>

                <div className="card-bottom-row" style={{ marginTop: 4 }}>
                  <div>
                    <span style={{ fontSize: 11, color: '#1d4ed8', fontWeight: 800 }}>Komisyon: </span>
                    <strong style={{ fontSize: 14, fontFamily: 'monospace', color: '#1d4ed8' }}>
                      {Number(r.commission || 0).toLocaleString('tr-TR')} ₺
                    </strong>
                  </div>

                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDeleteOrderRow(r.id)}
                    style={{ padding: '5px 8px' }}
                    title="Sil"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}

            {orderParamRows.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                Kayıtlı sipariş parametresi bulunamadı.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. KASA PARAMETRELERİ */}
      {activeSubTab === 'cash' && (
        <div className="responsive-grid-2" style={{ gap: 16 }}>
          <div className="glass-card" style={{ padding: 0, background: '#fff', overflow: 'hidden', border: '1.5px solid var(--border-color)' }}>
            <div style={{ padding: '12px 18px', background: '#f1f5f9', borderBottom: '1px solid var(--border-color)' }}>
              <strong style={{ fontSize: 14, color: '#0f172a' }}>Kasa & Banka Hesap Tanımları</strong>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Kasa / Hesap Adı</th>
                  <th>Para Birimi</th>
                  <th>Hesap Kodu</th>
                  <th>Durum</th>
                  <th style={{ width: 90, textAlign: 'center' }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {cashAccounts.map((ca, idx) => (
                  <tr key={ca.id}>
                    <td style={{ textAlign: 'center', fontWeight: 800, color: 'var(--diza-red)' }}>{idx + 1}</td>
                    <td><strong>{ca.name}</strong> {ca.isDefault && <span style={{ fontSize: 10, color: '#047857', fontWeight: 800 }}>(Varsayılan)</span>}</td>
                    <td style={{ textAlign: 'center', fontWeight: 800, color: '#1d4ed8' }}>{ca.currency}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{ca.code}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge-status badge-teslim">Aktif</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => setEditingCashAccount(ca)}
                          style={{ background: 'none', border: 'none', color: '#1d4ed8', cursor: 'pointer', padding: 2 }}
                          title="Düzelt"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCashAccounts(prev => prev.filter(c => c.id !== ca.id))}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}
                          title="Sil"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="glass-card" style={{ padding: 18, background: '#fff' }}>
            <h4 style={{ fontSize: 14, fontWeight: 900, marginBottom: 12, color: '#0f172a' }}>
              {editingCashAccount ? 'Kasa Hesabını Düzelt' : '+ Yeni Kasa / Hesap Ekle'}
            </h4>
            <form onSubmit={editingCashAccount ? handleSaveEditCash : handleAddCashAccount} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 11, fontWeight: 800 }}>KASA / HESAP ADI</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Örn: Ziraat Bankası Şirket Hesabı"
                  value={editingCashAccount ? editingCashAccount.name : draftCashAccount.name}
                  onChange={e => editingCashAccount ? setEditingCashAccount({ ...editingCashAccount, name: e.target.value }) : setDraftCashAccount({ ...draftCashAccount, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 11, fontWeight: 800 }}>PARA BİRİMİ</label>
                <select
                  className="form-control"
                  value={editingCashAccount ? editingCashAccount.currency : draftCashAccount.currency}
                  onChange={e => editingCashAccount ? setEditingCashAccount({ ...editingCashAccount, currency: e.target.value }) : setDraftCashAccount({ ...draftCashAccount, currency: e.target.value })}
                >
                  <option value="TL">TL (Türk Lirası)</option>
                  <option value="USD">USD (Amerikan Doları)</option>
                  <option value="EUR">EUR (Euro)</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 11, fontWeight: 800 }}>HESAP KODU</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Örn: BNK-03"
                  value={editingCashAccount ? editingCashAccount.code : draftCashAccount.code}
                  onChange={e => editingCashAccount ? setEditingCashAccount({ ...editingCashAccount, code: e.target.value.toUpperCase() }) : setDraftCashAccount({ ...draftCashAccount, code: e.target.value.toUpperCase() })}
                />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                {editingCashAccount && (
                  <button type="button" className="btn btn-secondary" onClick={() => setEditingCashAccount(null)} style={{ flex: 1 }}>
                    İptal
                  </button>
                )}
                <button type="submit" className="btn btn-primary" style={{ flex: 2, fontWeight: 800 }}>
                  {editingCashAccount ? 'Değişikliği Kaydet' : '+ Kasa Hesabı Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MASRAF PARAMETRELERİ (İki Bölümlü / Çift Tablolu Kompakt Düzen) */}
      {activeSubTab === 'expenses' && (() => {
        const filteredExpenses = expenseCategories.filter(ec => {
          const q = expenseSearchTerm.toLowerCase();
          const kat = String((ec as any).kategoriNo ?? ec.id);
          return ec.name.toLowerCase().includes(q) || kat.includes(q) || (ec.code && ec.code.toLowerCase().includes(q));
        });

        const half = Math.ceil(filteredExpenses.length / 2);
        const col1 = filteredExpenses.slice(0, half);
        const col2 = filteredExpenses.slice(half);

        return (
          <div className="responsive-grid-2" style={{ gap: 16, alignItems: 'start' }}>
            {/* Sol Bölüm: Arama ve İki Kolonlu Yan Yana Tablo */}
            <div
              className="glass-card"
              style={{
                padding: 0,
                background: '#fff',
                overflow: 'hidden',
                border: '1.5px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              {/* Üst Başlık & Arama Çubuğu */}
              <div
                style={{
                  padding: '12px 16px',
                  background: '#f8fafc',
                  borderBottom: '1.5px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                  flexWrap: 'wrap'
                }}
              >
                <div>
                  <strong style={{ fontSize: 14, color: '#0f172a' }}>
                    Kasa & Sefer Masraf Kalemleri ({expenseCategories.length})
                  </strong>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>
                    * Yan yana 2 bölüm olarak listelenmektedir
                  </span>
                </div>

                <div style={{ position: 'relative', width: 220 }}>
                  <Search size={14} color="var(--text-dim)" style={{ position: 'absolute', left: 10, top: 9 }} />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Masraf / No ara..."
                    value={expenseSearchTerm}
                    onChange={e => setExpenseSearchTerm(e.target.value)}
                    style={{ paddingLeft: 30, padding: '5px 8px 5px 30px', fontSize: 11 }}
                  />
                </div>
              </div>

              {/* Sabit Yükseklikli 2 Bölümlü Kapsayıcı (Sayfa Aşağı Uzamaz) */}
              <div
                className="responsive-grid-2"
                style={{
                  maxHeight: 'calc(100vh - 290px)',
                  overflowY: 'auto',
                  padding: 10,
                  gap: 12,
                  background: '#f1f5f9'
                }}
              >
                {/* 1. BÖLÜM (Sol Tablo) */}
                <div style={{ background: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                  <table className="data-table" style={{ fontSize: 11 }}>
                    <thead>
                      <tr style={{ background: '#e2e8f0', color: '#1e293b' }}>
                        <th style={{ width: 50, textAlign: 'center', padding: '6px 4px' }}>No</th>
                        <th style={{ textAlign: 'left', padding: '6px 8px' }}>Açıklama (Masraf Adı)</th>
                        <th style={{ width: 50, textAlign: 'center', padding: '6px 4px' }}>KDV</th>
                        <th style={{ width: 65, textAlign: 'center', padding: '6px 4px' }}>İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {col1.map(ec => (
                        <tr key={ec.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ textAlign: 'center', fontWeight: 900, color: 'var(--diza-red)', fontFamily: 'var(--font-mono)', padding: '5px 4px' }}>
                            {(ec as any).kategoriNo ?? ec.id}
                          </td>
                          <td style={{ padding: '5px 8px' }}>
                            <strong style={{ color: '#0f172a', fontSize: 11 }}>{ec.name}</strong>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 700, color: '#1d4ed8', padding: '5px 4px' }}>
                            %{ec.vatRate}
                          </td>
                          <td style={{ textAlign: 'center', padding: '5px 4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
                              <button
                                type="button"
                                onClick={() => setEditingExpense(ec)}
                                style={{ background: 'none', border: 'none', color: '#1d4ed8', cursor: 'pointer', padding: 2 }}
                                title="Düzelt"
                              >
                                <Edit size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setExpenseCategories(prev => prev.filter(c => c.id !== ec.id))}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}
                                title="Sil"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {col1.length === 0 && (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
                            Kayıt bulunamadı.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 2. BÖLÜM (Sağ Tablo) */}
                <div style={{ background: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                  <table className="data-table" style={{ fontSize: 11 }}>
                    <thead>
                      <tr style={{ background: '#e2e8f0', color: '#1e293b' }}>
                        <th style={{ width: 50, textAlign: 'center', padding: '6px 4px' }}>No</th>
                        <th style={{ textAlign: 'left', padding: '6px 8px' }}>Açıklama (Masraf Adı)</th>
                        <th style={{ width: 50, textAlign: 'center', padding: '6px 4px' }}>KDV</th>
                        <th style={{ width: 65, textAlign: 'center', padding: '6px 4px' }}>İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {col2.map(ec => (
                        <tr key={ec.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ textAlign: 'center', fontWeight: 900, color: 'var(--diza-red)', fontFamily: 'var(--font-mono)', padding: '5px 4px' }}>
                            {(ec as any).kategoriNo ?? ec.id}
                          </td>
                          <td style={{ padding: '5px 8px' }}>
                            <strong style={{ color: '#0f172a', fontSize: 11 }}>{ec.name}</strong>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 700, color: '#1d4ed8', padding: '5px 4px' }}>
                            %{ec.vatRate}
                          </td>
                          <td style={{ textAlign: 'center', padding: '5px 4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
                              <button
                                type="button"
                                onClick={() => setEditingExpense(ec)}
                                style={{ background: 'none', border: 'none', color: '#1d4ed8', cursor: 'pointer', padding: 2 }}
                                title="Düzelt"
                              >
                                <Edit size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setExpenseCategories(prev => prev.filter(c => c.id !== ec.id))}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}
                                title="Sil"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {col2.length === 0 && (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
                            -
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Sağ Panel: + Yeni Masraf Ekle / Düzelt Formu */}
            <div className="glass-card" style={{ padding: 18, background: '#fff', border: '1.5px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <h4 style={{ fontSize: 14, fontWeight: 900, marginBottom: 12, color: '#0f172a' }}>
                {editingExpense ? 'Masraf Kalemini Düzelt' : '+ Yeni Masraf Kalemi Ekle'}
              </h4>
              <form onSubmit={editingExpense ? handleSaveEditExpense : handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Kategori No */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: 11, fontWeight: 800 }}>KATEGORİ NO</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Örn: 77"
                    value={editingExpense ? ((editingExpense as any).kategoriNo ?? editingExpense.id) : draftExpense.kategoriNo}
                    onChange={e => editingExpense ? setEditingExpense({ ...editingExpense, kategoriNo: Number(e.target.value) }) : setDraftExpense({ ...draftExpense, kategoriNo: Number(e.target.value) })}
                    style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--diza-red)' }}
                    required
                  />
                </div>

                {/* Açıklama / Masraf Adı */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: 11, fontWeight: 800 }}>AÇIKLAMA / MASRAF ADI</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Örn: DAİRE TOKİ TAKSİT"
                    value={editingExpense ? editingExpense.name : draftExpense.name}
                    onChange={e => editingExpense ? setEditingExpense({ ...editingExpense, name: e.target.value }) : setDraftExpense({ ...draftExpense, name: e.target.value })}
                    required
                  />
                </div>

                {/* KDV Oranı */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: 11, fontWeight: 800 }}>KDV ORANI %</label>
                  <select
                    className="form-control"
                    value={editingExpense ? editingExpense.vatRate : draftExpense.vatRate}
                    onChange={e => editingExpense ? setEditingExpense({ ...editingExpense, vatRate: Number(e.target.value) }) : setDraftExpense({ ...draftExpense, vatRate: Number(e.target.value) })}
                  >
                    {vatRates.map(v => (
                      <option key={v.id} value={v.rate}>%{v.rate} ({v.name})</option>
                    ))}
                  </select>
                </div>

                {/* Şoför Sefer Masrafı Checkbox */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                    <input
                      type="checkbox"
                      checked={editingExpense ? editingExpense.isDriverExpense : draftExpense.isDriverExpense}
                      onChange={e => editingExpense ? setEditingExpense({ ...editingExpense, isDriverExpense: e.target.checked }) : setDraftExpense({ ...draftExpense, isDriverExpense: e.target.checked })}
                    />
                    Şoför Sefer Masrafı Olarak Kullan
                  </label>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  {editingExpense && (
                    <button type="button" className="btn btn-secondary" onClick={() => setEditingExpense(null)} style={{ flex: 1, fontWeight: 800 }}>
                      İptal
                    </button>
                  )}
                  <button type="submit" className="btn btn-primary" style={{ flex: 2, fontWeight: 900 }}>
                    {editingExpense ? 'Değişikliği Kaydet' : '+ Masraf Ekle'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* 7. FATURA PARAMETRELERİ */}
      {activeSubTab === 'invoices' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Tevkifat Oranları */}
          <div className="glass-card" style={{ padding: 0, background: '#fff', overflow: 'hidden', border: '1.5px solid var(--border-color)' }}>
            <div style={{ padding: '12px 18px', background: '#f1f5f9', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: 14, color: '#0f172a' }}>Resmî KDV Tevkifat Oranları</strong>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tevkifat Tanımı</th>
                  <th>Oran</th>
                  <th>GİB Kodu</th>
                  <th style={{ width: 80, textAlign: 'center' }}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {withholdingRates.map(wr => (
                  <tr key={wr.id}>
                    <td><strong>{wr.name}</strong></td>
                    <td style={{ textAlign: 'center', fontWeight: 800, color: 'var(--diza-red)' }}>{wr.numerator}/{wr.denominator}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center' }}>{wr.code}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setEditingWithholding(wr)}
                        style={{ background: 'none', border: 'none', color: '#1d4ed8', cursor: 'pointer', padding: 2 }}
                        title="Düzelt"
                      >
                        <Edit size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {editingWithholding && (
              <form onSubmit={handleSaveEditWithholding} style={{ padding: 14, background: '#eff6ff', borderTop: '1.5px solid #bfdbfe', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <strong style={{ fontSize: 12, color: '#1d4ed8' }}>Tevkifat Oranını Düzelt:</strong>
                <input
                  type="text"
                  className="form-control"
                  value={editingWithholding.name}
                  onChange={e => setEditingWithholding({ ...editingWithholding, name: e.target.value })}
                  placeholder="Tevkifat Adı"
                  required
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <input
                    type="number"
                    className="form-control"
                    value={editingWithholding.numerator}
                    onChange={e => setEditingWithholding({ ...editingWithholding, numerator: Number(e.target.value) })}
                    placeholder="Pay (Örn: 5)"
                    required
                  />
                  <input
                    type="text"
                    className="form-control"
                    value={editingWithholding.code}
                    onChange={e => setEditingWithholding({ ...editingWithholding, code: e.target.value })}
                    placeholder="GİB Kodu (624)"
                  />
                </div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingWithholding(null)}>
                    İptal
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm">
                    Kaydet
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* KDV Oranları ve Fatura Seri Tanımları */}
          <div className="glass-card" style={{ padding: 18, background: '#fff', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h4 style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  KDV Oran Standartları
                </h4>
                <span style={{ fontSize: 11, color: 'var(--diza-red)', fontWeight: 800 }}>
                  * Tıklayarak varsayılan KDV oranını belirleyin
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {vatRates.map(v => (
                  <div
                    key={v.id}
                    onClick={() => {
                      setDefaultVatRate(v.rate);
                      setSaveMessage(`✓ Varsayılan KDV oranı %${v.rate} olarak ayarlandı.`);
                      setTimeout(() => setSaveMessage(null), 2500);
                    }}
                    style={{
                      padding: '12px 8px',
                      borderRadius: 'var(--radius-md)',
                      background: v.isDefault ? 'var(--diza-red-light)' : '#f8fafc',
                      border: v.isDefault ? '2px solid var(--diza-red)' : '1px solid var(--border-color)',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      position: 'relative'
                    }}
                  >
                    {v.isDefault && (
                      <span
                        style={{
                          position: 'absolute',
                          top: -8,
                          right: 6,
                          background: 'var(--diza-red)',
                          color: '#fff',
                          fontSize: 9,
                          fontWeight: 900,
                          padding: '1px 6px',
                          borderRadius: 10
                        }}
                      >
                        VARSAYILAN
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', fontWeight: 700 }}>{v.name}</span>
                    <h3 style={{ fontSize: 20, fontWeight: 900, color: v.isDefault ? 'var(--diza-red)' : '#0f172a', margin: '4px 0 0 0' }}>
                      %{v.rate}
                    </h3>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 14 }}>
              <h4 style={{ fontSize: 14, fontWeight: 900, marginBottom: 8, color: '#0f172a' }}>e-Fatura & e-İrsaliye Ön Ek Şablonu</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
                <div style={{ padding: 10, background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Fatura Seri Ön Eki:</span>
                  <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--diza-red)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>TUR2026</div>
                </div>
                <div style={{ padding: 10, background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>İrsaliye Seri Ön Eki:</span>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#1d4ed8', fontFamily: 'var(--font-mono)', marginTop: 2 }}>IRS2026</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
