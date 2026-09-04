// DİZA Lojistik & Filo Yönetim Sistemi — Veri Tipleri
// Gördit Bilgisayar — Zafer GÖRGÜN

export type CurrencyType = 'TL' | 'USD' | 'EUR';

export type PaymentStatus = 'ODENDI' | 'ODENMEDI' | 'KISMI' | 'BEKLEMEDE';

export type ShipmentStatus = 'SIPARIS' | 'YOLDA' | 'TESLIM_EDILDI' | 'FATURALANDI' | 'IPTAL';

// 1. Araç Bilgileri (Access: Arac_Bilgileri tam şeması)
export interface Vehicle {
  id: number;
  // Üst Alanlar
  plate: string;            // Araç Plakası (47 aac 114)
  trailerPlate?: string;    // Dorse Plakası (55 aaz 504)
  driverName: string;       // Sürücü Adı Soyadı (Zafer GÖRGÜN)
  accountType?: 'ARAC' | 'OZEL'; // Hesap Seçimi: Araç / Özel
  invoiceTitle?: string;    // Fatura Ünvanı (GÖRDİT ULUS. NAK.)
  iban?: string;            // İBAN (TR... işbank)

  // ARAÇ BİLGİLERİ
  licenseOwner?: string;    // Ruhsat Sahibi (GÖRDİT ULUS. NAK.)
  documentNo?: string;      // Belge No
  registrationNo?: string;  // Tescil No / Tarihi
  brand?: string;           // Markası (Mercedes, Scania, Volvo, Ford, MAN, DAF vb.)
  color?: string;           // Rengi
  modelYear?: string;       // Modeli (2020, 2023 vb.)
  vehicleTypeHeader?: string; // Tipi
  chassisNo?: string;       // Şase No
  vehicleFeature?: string;  // Aracın Özelliği (Kısa Dorse Damperli, Tenteli vb.)
  isProblematic?: boolean;  // Problemli mi? (Evet / Hayır)
  problemReason?: string;   // Problem açıklaması

  // SÜRÜCÜ VEYA KİŞİSEL BİLGİLER
  drivingLicenseNo?: string;// Ehliyet No
  licenseIssuedPlace?: string; // Alındığı Yer
  address?: string;         // Adres
  phone: string;            // Cep Telefonu
  workPhone?: string;       // İş Telefonu
  reference?: string;       // Referans
  notes?: string;           // Açıklama
  taxOffice?: string;       // Vergi Dairesi
  taxOrIdNumber?: string;   // V.No / TC Kimlik No

  // Operasyonel Alanlar
  location?: string;        // Mevcut Konumu
  vehicleType?: string;     // Kamyon / Tır
  capacityTons?: number;    // Kapasite
  isActive: boolean;
}

// 1.1 Araç Kayıt Alt Tablosu (Access: Yukler_alt / Arac Yukleri)
export interface VehicleShipmentRow {
  id: number;
  sNo: string;              // S.No (örn: 13232, 13252)
  definedLoad?: string;     // Tanımlı Yük (örn: MERSİN)
  plate: string;            // Plaka (örn: 06 ABC 47 - 06...)
  date: string;             // Tarih (örn: 2026-09-01)
  company: string;          // Firma (örn: ETİ BAKIR)
  transporter?: string;     // Nakliyeci (örn: TÜRKLER NAKLİYAT)
  intermediary?: string;    // Aracı (örn: TÜRKLER NAK...)
  loadingPlace: string;     // Yükleme Yeri (örn: SAMSUN, ETİ BAKIR)
  unloadingPlace: string;   // İndirme Yeri (örn: MARDİN, MERSİN)
  unloadingDistrict?: string;// İndirme İlçesi (örn: MERKEZ, TARSUS)
  goodsType: string;        // Cinsi (örn: DÖKME, DEMİROKSİT)
  quantity: number;         // Miktar (örn: 27.12, 26.50)
  buyPrice: number;         // AL_Fiyat (Alış Navlun Fiyatı örn: 213.00)
  sellPrice: number;        // Sat_Fiyat (Satış Fiyatı örn: 215.00)
  vatRate: number;          // KDV (örn: 18, 20)
  commission: number;       // Komisyon (örn: 200, 1000)
  notes?: string;           // Not
  dispatchAddress?: string; // sevk_adresi
}

// 1.2 Parametreler: Sipariş & Sevkiyat Tanımları (Access: Yukler_siparisler)
export interface OrderParamRow {
  id: number;
  sip_id: string;           // sip_id (örn: 1, 2, Yeni)
  show: boolean;            // Göster (Checkbox)
  loadTitle: string;        // Yükün Tanımı (örn: MERSİN, İSKENDERUN)
  company: string;          // Firma (örn: ETİ BAKIR)
  transporter?: string;     // Nakliyeci (örn: TÜRKLER NAKLİYAT)
  intermediary?: string;    // Aracı (örn: TÜRKLER NAK)
  loadingPlace: string;     // Yükleme Yeri (örn: ETİ BAKIR)
  unloadingPlace: string;   // İndirme Yeri (örn: MERSİN, HATAY, MARDİN)
  unloadingDistrict?: string;// İndirme İlçesi (örn: TARSUS, İSKENDERUN, MERKEZ)
  goodsType: string;        // Cinsi (örn: DEMİROKSİT, DÖKME)
  quantity?: number;        // Miktar
  buyPrice?: number;        // AL_Fiyat (örn: 250.00, 220.00)
  sellPrice?: number;       // Sat_Fiyat (örn: 260.00, 230.00)
  vatRate: number;          // KDV (örn: 18, 20)
  commission?: number;      // Komisyon (örn: 1000)
  dispatchAddress?: string; // sevk_adresi
  orderDate?: string;       // siparis_tarihi
  orderSeqNo?: string;      // sip_sira_no
  orderProduct?: string;    // sip_urun
  orderCustomer?: string;   // sip_musteri
}

// 2. Müşteri / Cari (musteriler - Güncellenmiş Şema)
export interface Customer {
  id: number;
  name: string;                   // Firma / Müşteri Ticari Ünvanı
  authorizedFirstName?: string;   // Yetkili Adı
  authorizedLastName?: string;    // Yetkili Soyadı
  authorizedPerson?: string;      // Geriye dönük uyumluluk için tam ad
  
  // İletişim (11 Haneli Sabit Format: 05XXXXXXXXX veya 03XXXXXXXXX)
  phone: string;                  // Varsayılan telefon (GSM)
  gsmPhone?: string;              // GSM / Cep Telefonu (11 Hane)
  workPhone?: string;             // İş Telefonu (11 Hane)
  fax?: string;                   // Fax / Belgegeçer (11 Hane)
  email?: string;                 // E-Posta
  
  // Adres ve Lokasyon
  city: string;                   // İl (Şehir)
  district?: string;              // İlçe
  address: string;                // Geriye dönük uyumluluk
  billingAddress: string;         // Fatura Adresi
  shippingAddress?: string;       // Kargo Adresi / Sevk Adresi
  
  // Vergi ve Risk Durumu
  taxOffice?: string;             // Vergi Dairesi
  taxNumber?: string;             // Vergi No / TCKN
  isProblematic: boolean;         // Riskli / Problemli Firma (Kara Liste)
  problemReason?: string;         // Problem Açıklaması
  notes?: string;                 // Özel Notlar
}

// 3. Yük & Sipariş Kaydı (Yukler & Siparisler)
export interface Shipment {
  id: number;
  shipmentNo: string;     // Yük / Sefer Takip No
  orderDate: string;      // Siparis Tarihi (YYYY-MM-DD)
  loadingDate: string;    // Yükleme Tarihi
  deliveryDate?: string;  // Teslim Tarihi
  customerId: number;     // musteriler (musno)
  customerName: string;
  loadingLocation: string;// yukleme_yeri (Örn: Mersin Limanı)
  unloadingLocation: string; // indirme_yeri (Örn: Kayseri OSB)
  senderCompany: string;  // Gonderici
  receiverCompany: string;// Alici
  goodsType: string;      // Cinsi (Örn: Profil Boru, Demir, Gıda)
  packaging: string;      // Ambalaj (Örn: Palet, Rulo, Dökme, Çuval)
  quantity: number;       // Miktar / Tonaj
  unit: string;           // Ton, Adet, Sefer, Paket
  unitPrice: number;      // Birim Fiyat (Navlun)
  currency: CurrencyType; // Paracinsi (TL, USD, EUR)
  vatRate: number;        // KDV Oranı (0, 10, 20)
  withholdingRate: string;// Tevkifat_orani (Yok, 4/10, 5/10, 7/10, 9/10 vb.)
  totalAmount: number;    // Toplam Tutar
  vatAmount: number;      // KDV Tutarı
  withholdingAmount: number; // Tevkifat Tutarı
  netPayableAmount: number; // Ödenecek Net Tutar
  vehicleId?: number;     // Plaka ID
  vehiclePlate?: string;  // Arac_Plakasi
  driverName?: string;    // Sofor
  driverPhone?: string;
  driverFreightCost?: number; // Nakliyeci / Araç Alacak Bedeli (Şoför Hakedişi)
  status: ShipmentStatus;
  invoiced: boolean;      // Faturaya aktarıldı mı?
  invoiceId?: number;     // Bağlı Fatura ID
  notes?: string;
}

// 4. Fatura (faturalar & Faturalar_alt)
export interface InvoiceItem {
  id: string;
  shipmentId?: number;
  description: string;    // Aciklama / Yük detayı
  quantity: number;
  unit: string;
  unitPrice: number;
  currency: CurrencyType;
  vatRate: number;
  withholdingRate: string;
  total: number;
}

export interface Invoice {
  id: number;
  invoiceNo: string;      // Fatura No (örn: TUR2026000123)
  invoiceDate: string;    // Tarih
  type: 'SATIS' | 'ALIS'; // cikis (Satış/Gelir) / giris (Alış/Masraf)
  customerId: number;
  customerName: string;
  taxOffice?: string;
  taxNumber?: string;
  address?: string;
  currency: CurrencyType;
  exchangeRate: number;   // Kur (TL karşılığı)
  subTotal: number;       // Matrah (Ara Toplam)
  vatTotal: number;       // Toplam KDV
  withholdingTotal: number;// Tevkifat Toplamı
  grandTotal: number;     // Genel Toplam
  writtenText: string;    // Tutarın Türkçe Yazıyla Karşılığı (VBA tl_yaz)
  paymentStatus: PaymentStatus;
  items: InvoiceItem[];
  notes?: string;
}

// 5. Araç & Cari Finans Hareketleri (Hareketler_data)
export interface Transaction {
  id: number;
  date: string;
  vehicleId?: number;     // Plaka
  vehiclePlate?: string;
  customerId?: number;    // musno
  customerName?: string;
  type: 'ALACAK' | 'BORC';// Hakediş / Gelir (Alacak) veya Avans / Masraf / Ödeme (Borç)
  category: string;       // Navlun, Avans, Mazot, Tamir, Tahsilat, Fatura
  amount: number;
  currency: CurrencyType;
  exchangeRate: number;
  description: string;
  referenceType?: 'SHIPMENT' | 'INVOICE' | 'CASH' | 'CHECK';
  referenceId?: number;
}

// 6. Kasa Defteri (Kasa & Kasa_ana)
export interface CashEntry {
  id: number;
  date: string;
  time: string;
  type: 'GIRIS' | 'CIKIS';
  category: string;       // Tahsilat, Şoför Avansı, Mazot, Yemek, Kira, Vergi, Ofis Gideri vb.
  amount: number;
  currency: CurrencyType;
  description: string;
  recipientOrSender: string; // Kimden alındı / Kime ödendi
  vehiclePlate?: string;
  customerId?: number;
}

// 7. Vade & Çek / Senet Hatırlatıcı (Alacak_verecek_data)
export interface ReminderCheck {
  id: number;
  type: 'CEK' | 'SENET' | 'VADELI_HESAP';
  direction: 'ALACAK' | 'BORC'; // Müşteriden Alınan (Tahsilat) / Verilen (Ödeme)
  dueDate: string;        // Vade Tarihi
  amount: number;
  currency: CurrencyType;
  bankName?: string;      // Banka Adı
  checkNo?: string;       // Çek/Senet No
  issuer: string;         // Keşideci / Borçlu
  customerId?: number;
  customerName?: string;
  status: 'BEKLIYOR' | 'TAHSIL_EDILDI' | 'ODENDI' | 'KARSILIKSIZ';
  notes?: string;
}

// 8. Döviz Kurları (tbl_kurlistesi)
export interface ExchangeRate {
  currency: CurrencyType;
  buyRate: number;
  sellRate: number;
  updateDate: string;
}
