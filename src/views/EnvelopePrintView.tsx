import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Mail, Printer, Building, User, Phone, MapPin } from 'lucide-react';

export const EnvelopePrintView: React.FC = () => {
  const { customers } = useApp();

  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(customers[0]?.id || 101);
  const [customReceiverAddress, setCustomReceiverAddress] = useState<string>('');
  const [envelopeType, setEnvelopeType] = useState<'KUCUK' | 'BUYUK'>('KUCUK');
  const [customAttention, setCustomAttention] = useState<string>('Muhasebe / Finans Servisi');

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) || customers[0];

  const receiverAddress = customReceiverAddress || selectedCustomer?.billingAddress || selectedCustomer?.address || '';
  const receiverTax = selectedCustomer ? `${selectedCustomer.taxOffice ? selectedCustomer.taxOffice + ' V.D. ' : ''}${selectedCustomer.taxNumber || ''}` : '';
  const receiverPhone = selectedCustomer?.gsmPhone || selectedCustomer?.phone || '';
  const receiverAuth = selectedCustomer ? `${selectedCustomer.authorizedFirstName || ''} ${selectedCustomer.authorizedLastName || ''}`.trim() || selectedCustomer.authorizedPerson : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Üst Seçim ve Ayar Kartı */}
      <div className="glass-card no-print" style={{ padding: '14px 18px', background: '#fff' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 10 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', margin: 0 }}>
              Zarf & Resmi Evrak Yazdırma Modülü
            </h3>
            <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: 0 }}>
              Fatura, ekstre ve resmi evrak gönderimleri için standart zarf şablonları
            </p>
          </div>

          <button className="btn btn-primary" onClick={() => window.print()}>
            <Printer size={16} /> Zarfı Yazdır
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          {/* Müşteri Seçimi */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: '#475569' }}>ALICI MÜŞTERİ / CARİ</label>
            <select
              className="form-control"
              value={selectedCustomerId}
              onChange={e => {
                setSelectedCustomerId(Number(e.target.value));
                setCustomReceiverAddress('');
              }}
            >
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.city})
                </option>
              ))}
            </select>
          </div>

          {/* Zarf Tipi */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: '#475569' }}>ZARF EBATI</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className={`btn btn-sm ${envelopeType === 'KUCUK' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setEnvelopeType('KUCUK')}
              >
                Küçük Zarf (Diplomat 11x22)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${envelopeType === 'BUYUK' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setEnvelopeType('BUYUK')}
              >
                Büyük Zarf (A4 Torba 24x32)
              </button>
            </div>
          </div>

          {/* İlgili Kişi / Departman */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: '#475569' }}>İLGİLİ BİRİM / KİŞİ (DİKKATİNE)</label>
            <input
              type="text"
              className="form-control"
              value={customAttention}
              onChange={e => setCustomAttention(e.target.value)}
              placeholder="Örn: Muhasebe Müdürü Kemal Bey"
            />
          </div>
        </div>
      </div>

      {/* ZARF ÖNİZLEME ALANI (Mobilde yatay kaydırma korumalı) */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0', overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
        {envelopeType === 'KUCUK' ? (
          /* KÜÇÜK DİPLOMAT ZARF (110mm x 220mm standart oran) */
          <div
            className="printable-envelope"
            style={{
              width: '220mm',
              height: '110mm',
              background: '#ffffff',
              border: '2px solid #cbd5e1',
              boxShadow: 'var(--shadow-lg)',
              padding: '12mm 16mm',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxSizing: 'border-box',
              color: '#0f172a',
              fontFamily: 'Arial, sans-serif'
            }}
          >
            {/* Sol Üst: GÖNDERİCİ BİLGİLERİ */}
            <div style={{ maxWidth: '90mm' }}>
              <h4 style={{ fontSize: 13, fontWeight: 900, color: 'var(--diza-red)', letterSpacing: 0.5, margin: 0 }}>
                DİZA LOJİSTİK
              </h4>
              <p style={{ fontSize: 9, fontWeight: 700, margin: '2px 0 0 0', color: '#334155' }}>
                Gördit Bilgisayar ve Taşımacılık Ltd. Şti.
              </p>
              <p style={{ fontSize: 8.5, color: '#64748b', margin: '2px 0 0 0', lineHeight: 1.3 }}>
                Liman Cad. Diza Plaza No:12 Mersin<br />
                Tel: 0(324) 233 00 00 | Uray V.D. 3120456789
              </p>
            </div>

            {/* Sağ Alt: ALICI BİLGİLERİ (Büyük ve Net) */}
            <div
              style={{
                alignSelf: 'flex-end',
                width: '115mm',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 6,
                padding: '10px 14px',
                textAlign: 'left'
              }}
            >
              <div style={{ fontSize: 9, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 }}>
                SAYIN (ALICI):
              </div>
              <h3 style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', margin: '0 0 4px 0' }}>
                {selectedCustomer?.name}
              </h3>
              {customAttention && (
                <p style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--diza-red)', margin: '0 0 4px 0' }}>
                  Sn. {receiverAuth ? `${receiverAuth} (${customAttention})` : customAttention}
                </p>
              )}
              <p style={{ fontSize: 9.5, color: '#334155', margin: 0, lineHeight: 1.4, fontWeight: 500 }}>
                {receiverAddress}
              </p>
              <p style={{ fontSize: 10, fontWeight: 800, color: '#0f172a', margin: '4px 0 0 0' }}>
                {selectedCustomer?.city} {selectedCustomer?.district ? `/ ${selectedCustomer.district}` : ''}
              </p>
              {receiverPhone && (
                <p style={{ fontSize: 8.5, color: '#64748b', margin: '2px 0 0 0' }}>
                  Tel: {receiverPhone}
                </p>
              )}
            </div>
          </div>
        ) : (
          /* BÜYÜK A4 TORBA ZARF (240mm x 320mm standart oran) */
          <div
            className="printable-envelope"
            style={{
              width: '240mm',
              height: '160mm',
              background: '#ffffff',
              border: '2px solid #cbd5e1',
              boxShadow: 'var(--shadow-lg)',
              padding: '16mm 20mm',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxSizing: 'border-box',
              color: '#0f172a',
              fontFamily: 'Arial, sans-serif'
            }}
          >
            {/* Sol Üst: GÖNDERİCİ */}
            <div style={{ maxWidth: '120mm' }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: 'var(--diza-red)', letterSpacing: 0.5, margin: 0 }}>
                DİZA LOJİSTİK
              </h3>
              <p style={{ fontSize: 11, fontWeight: 700, margin: '3px 0 0 0', color: '#334155' }}>
                Gördit Bilgisayar ve Taşımacılık San. Tic. Ltd. Şti.
              </p>
              <p style={{ fontSize: 10, color: '#64748b', margin: '3px 0 0 0', lineHeight: 1.4 }}>
                Liman Cad. Diza Plaza No:12 Mersin / Türkiye<br />
                Tel: 0(324) 233 00 00 | Uray V.D. 3120456789
              </p>
            </div>

            {/* Sağ Alt: ALICI */}
            <div
              style={{
                alignSelf: 'flex-end',
                width: '140mm',
                background: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                borderRadius: 8,
                padding: '16px 20px',
                textAlign: 'left'
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>
                SAYIN:
              </div>
              <h2 style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0' }}>
                {selectedCustomer?.name}
              </h2>
              {customAttention && (
                <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--diza-red)', margin: '0 0 6px 0' }}>
                  Dikkatine: {receiverAuth ? `${receiverAuth} - ` : ''}{customAttention}
                </p>
              )}
              <p style={{ fontSize: 12, color: '#334155', margin: 0, lineHeight: 1.5, fontWeight: 600 }}>
                {receiverAddress}
              </p>
              <p style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', margin: '6px 0 0 0' }}>
                {selectedCustomer?.city} {selectedCustomer?.district ? `/ ${selectedCustomer.district}` : ''}
              </p>
              <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px solid #e2e8f0', fontSize: 10, color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                <span>Tel: {receiverPhone || '-'}</span>
                <span>{receiverTax}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
