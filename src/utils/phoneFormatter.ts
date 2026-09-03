// DİZA Lojistik & ERP — Telefon ve Fax Maskeleme Standardı
// Kural: 0(XXX) XXX XX XX (Örn: 0(541) 608 53 44 veya 0(324) 233 00 00)
// Gördit Bilgisayar — Zafer GÖRGÜN

/**
 * Girilen metni dinamik olarak 0(XXX) XXX XX XX formatına dönüştürür.
 * Kullanıcı yazdıkça anlık maskeleme yapar.
 */
export function formatPhoneNumber(value: string | undefined | null): string {
  if (!value) return '';

  // Sadece rakamları al
  let digits = value.replace(/\D/g, '');

  // Eğer boşsa boş döndür
  if (!digits) return '';

  // Eğer ilk hane 0 değilse ve kullanıcı doğrudan 5XX yazıyorsa başına 0 koy
  if (digits.length > 0 && digits[0] !== '0') {
    digits = '0' + digits;
  }

  // Maksimum 11 hane (0 + 10 hane)
  digits = digits.slice(0, 11);

  // Formatlama: 0(XXX) XXX XX XX
  const len = digits.length;

  if (len <= 1) {
    return digits; // "0"
  } else if (len <= 4) {
    // "0(541"
    return `${digits[0]}(${digits.slice(1)}`;
  } else if (len <= 7) {
    // "0(541) 608"
    return `${digits[0]}(${digits.slice(1, 4)}) ${digits.slice(4)}`;
  } else if (len <= 9) {
    // "0(541) 608 53"
    return `${digits[0]}(${digits.slice(1, 4)}) ${digits.slice(4, 7)} ${digits.slice(7)}`;
  } else {
    // "0(541) 608 53 44"
    return `${digits[0]}(${digits.slice(1, 4)}) ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9, 11)}`;
  }
}

/**
 * 0(XXX) XXX XX XX formatındaki numarayı tel: linkleri için 05XXXXXXXXX formatına çevirir.
 */
export function cleanPhoneForTelLink(value: string | undefined | null): string {
  if (!value) return '';
  return value.replace(/\D/g, '');
}
