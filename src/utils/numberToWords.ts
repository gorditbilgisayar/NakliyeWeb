// DİZA Lojistik — Access VBA (tl_yaz, Dolar_yaz, Euro_yaz) Algoritması
// Sayıyı Türkçe Yazıya Çevirme Modülü

const ones = ["", "Bir", "İki", "Üç", "Dört", "Beş", "Altı", "Yedi", "Sekiz", "Dokuz"];
const tens = ["", "On", "Yirmi", "Otuz", "Kırk", "Elli", "Altmış", "Yetmiş", "Seksen", "Doksan"];
const thousands = ["", "Bin", "Milyon", "Milyar", "Trilyon"];

function convertThreeDigit(num: number): string {
  let str = "";
  const h = Math.floor(num / 100);
  const t = Math.floor((num % 100) / 10);
  const o = num % 10;

  if (h > 0) {
    if (h === 1) {
      str += "Yüz";
    } else {
      str += ones[h] + "Yüz";
    }
  }

  if (t > 0) {
    str += tens[t];
  }

  if (o > 0) {
    str += ones[o];
  }

  return str;
}

function convertIntegerPart(num: number): string {
  if (num === 0) return "Sıfır";

  let result = "";
  let groupIndex = 0;
  let remaining = num;

  while (remaining > 0) {
    const chunk = remaining % 1000;
    if (chunk > 0) {
      let chunkStr = convertThreeDigit(chunk);
      // "BirBin" yerine "Bin" yazılır
      if (groupIndex === 1 && chunk === 1) {
        chunkStr = "";
      }
      result = chunkStr + thousands[groupIndex] + result;
    }
    remaining = Math.floor(remaining / 1000);
    groupIndex++;
  }

  return result;
}

export function numberToWords(amount: number, currency: 'TL' | 'USD' | 'EUR' = 'TL'): string {
  if (isNaN(amount) || amount === null || amount === undefined) return "";

  const isNegative = amount < 0;
  const totalCents = Math.round(Math.abs(amount) * 100);
  const integerPart = Math.floor(totalCents / 100);
  const decimalPart = totalCents % 100;

  const intWords = convertIntegerPart(integerPart);
  const decWords = decimalPart > 0 ? convertIntegerPart(decimalPart) : "";

  let mainUnit = "TürkLirası";
  let subUnit = "Kuruş";

  if (currency === 'USD') {
    mainUnit = "ABD Doları";
    subUnit = "Sent";
  } else if (currency === 'EUR') {
    mainUnit = "Euro";
    subUnit = "Sent";
  }

  let fullText = `# ${isNegative ? 'Eksi ' : ''}${intWords} ${mainUnit}`;
  if (decimalPart > 0) {
    fullText += ` ${decWords} ${subUnit} #`;
  } else {
    fullText += ` Sıfır ${subUnit} #`;
  }

  return fullText;
}

export function formatCurrency(amount: number, currency: 'TL' | 'USD' | 'EUR' = 'TL'): string {
  const symbol = currency === 'TL' ? '₺' : currency === 'USD' ? '$' : '€';
  const formatted = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);

  return `${formatted} ${symbol}`;
}

export function formatDate(dateString?: string): string {
  if (!dateString) return "-";
  try {
    const parts = dateString.split("-");
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    const d = new Date(dateString);
    return d.toLocaleDateString('tr-TR');
  } catch {
    return dateString;
  }
}
