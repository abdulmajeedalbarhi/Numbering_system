'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';

export default function Admin() {
  const [state, setState] = useState<any>(null);
  const [editBooking, setEditBooking] = useState<any>(null);
  const [showQR, setShowQR] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const fetchState = async () => {
    try {
      const res = await fetch('/api/queue');
      const data = await res.json();
      setState(data);
    } catch (err) {
      console.error('Failed to fetch state', err);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 3000);
    return () => clearInterval(interval);
  }, []);

  const adminAction = async (action: string, data: any = {}) => {
    try {
      const res = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data }),
      });
      if (res.ok) {
        fetchState();
        if (action === 'edit' || action === 'delete') {
          setEditBooking(null);
        }
      } else {
        alert('حدث خطأ في تنفيذ العملية');
      }
    } catch (err) {
      alert('حدث خطأ في الاتصال');
    }
  };

  if (!state) return <div style={{ padding: '2rem', textAlign: 'center' }}>جاري التحميل...</div>;

  return (
    <main style={{ maxWidth: '800px', padding: '0.5rem 0.5rem' }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1.25rem',
        backgroundColor: 'transparent',
        padding: '0.5rem 0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
          <Link href="/" style={{ textDecoration: 'none', fontSize: '1.25rem', padding: '0.4rem', background: '#fff', border: '1px solid var(--border)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            🏠
          </Link>
          <div className="card" style={{
            padding: '0.25rem 1.5rem',
            borderRadius: '1.5rem',
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '80px'
          }}>
            <img src="/logo.png" alt="البارحي" style={{ height: '100%', width: 'auto', objectFit: 'contain' }} />
          </div>
        </div>
        <button 
          onClick={() => setShowQR(true)}
          style={{ 
            background: 'var(--primary)', 
            color: 'white', 
            border: 'none', 
            borderRadius: '50%', 
            width: '38px', 
            height: '38px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '1.1rem',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
          title="عرض رمز QR"
        >
          📱
        </button>
      </header>

      <div className="admin-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <section className="card" style={{ padding: '0.5rem 0.75rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0' }}>الرقم الحالي</p>
          <div className="number-display" style={{ fontSize: '2.5rem', margin: '0.1rem 0' }}>
            {state.currentNumber || '-'}
          </div>
          
          {state.currentNumber > 0 && (
            <div style={{ marginBottom: '0.5rem', padding: '0.3rem 0.5rem', background: 'var(--bg)', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
              {(() => {
                const current = state.bookings.find((b: any) => b.id === state.currentNumber);
                return current ? (
                  <>
                    <p style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.85rem', marginBottom: '0' }}>{current.name}</p>
                    <p style={{ direction: 'ltr', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0' }}>+968 {current.phone}</p>
                  </>
                ) : (
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>تفاصيل غير متوفرة</p>
                );
              })()}
            </div>
          )}

          <button className="btn btn-primary" onClick={() => adminAction('next')} style={{ padding: '0.4rem', fontSize: '0.85rem' }}>
            العميل التالي
          </button>
        </section>

        <section className="card" style={{ padding: '0.5rem 0.75rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0' }}>حالة النظام</p>
          <div style={{ fontSize: '1rem', fontWeight: 700, margin: '0.4rem 0' }}>
            {state.isOpen ? 'مفتوح للجمهور' : 'مغلق حالياً'}
          </div>
          <button 
            className={`btn ${state.isOpen ? 'btn-outline' : 'btn-primary'}`} 
            style={{ 
              borderColor: state.isOpen ? 'var(--danger)' : '', 
              color: state.isOpen ? 'var(--danger)' : '', 
              padding: '0.4rem', 
              fontSize: '0.85rem',
              marginTop: '0' 
            }}
            onClick={() => adminAction('toggle')}
          >
            {state.isOpen ? 'إغلاق الحجز' : 'فتح الحجز'}
          </button>
        </section>

        <section className="card" style={{ gridColumn: 'span 2', padding: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>الحد الأقصى:</span>
            <input 
              type="number" 
              value={state.maxBookings}
              onChange={(e) => adminAction('setLimit', { limit: e.target.value })}
              style={{ width: '60px', textAlign: 'center', padding: '0.2rem', borderRadius: '0.4rem', border: '1px solid var(--border)', fontSize: '0.85rem' }}
            />
            <span style={{ fontWeight: 600, fontSize: '0.75rem' }}>حجز</span>
          </div>
        </section>
      </div>

      <section className="card" style={{ textAlign: 'right', padding: '0.5rem 0.75rem' }}>
        <h2 style={{ marginBottom: '0.4rem', fontSize: '1rem' }}>قائمة الانتظار ({state.bookings.filter((b: any) => b.id > state.currentNumber).length})</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '0.4rem', textAlign: 'right', fontSize: '0.8rem' }}>الرقم</th>
                <th style={{ padding: '0.4rem', textAlign: 'right', fontSize: '0.8rem' }}>الاسم</th>
                <th style={{ padding: '0.4rem', textAlign: 'right', fontSize: '0.8rem' }}>الهاتف</th>
                <th style={{ padding: '0.4rem', textAlign: 'center', fontSize: '0.8rem' }}>التحكم</th>
              </tr>
            </thead>
            <tbody>
              {state.bookings.filter((b: any) => b.id > state.currentNumber).map((booking: any) => (
                <tr key={booking.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.4rem', fontWeight: 800, fontSize: '0.85rem' }}>{booking.id}</td>
                  <td style={{ padding: '0.4rem', fontSize: '0.85rem' }}>{booking.name}</td>
                  <td style={{ padding: '0.4rem', fontSize: '0.85rem' }}>{booking.phone}</td>
                  <td style={{ padding: '0.4rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                      <button 
                        className="btn btn-outline" 
                        style={{ width: 'auto', padding: '0.1rem 0.3rem', fontSize: '0.65rem', marginTop: 0 }}
                        onClick={() => setEditBooking(booking)}
                      >
                        تعديل
                      </button>
                      <button 
                        className="btn btn-outline" 
                        style={{ width: 'auto', padding: '0.1rem 0.3rem', fontSize: '0.65rem', color: 'var(--danger)', borderColor: 'var(--danger)', marginTop: 0 }}
                        onClick={() => {
                          if (confirm('هل أنت متأكد من حذف هذا الحجز؟')) {
                            adminAction('delete', { id: booking.id });
                          }
                        }}
                      >
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {state.bookings.filter((b: any) => b.id > state.currentNumber).length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    لا يوجد عملاء في الانتظار
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <button 
          className="btn btn-outline" 
          style={{ marginTop: '0.5rem', color: 'var(--danger)', borderColor: 'var(--danger)', padding: '0.3rem', fontSize: '0.75rem', width: 'auto' }}
          onClick={() => {
            if (confirm('هل أنت متأكد من تصفير النظام؟ سيتم حذف جميع البيانات.')) {
              adminAction('reset');
            }
          }}
        >
          تصفير النظام (Reset)
        </button>
      </section>

      {editBooking && (
        <div className="modal-overlay">
          <div className="modal" style={{ padding: '1rem' }}>
            <h2 style={{ marginBottom: '0.75rem', color: 'var(--primary)', fontSize: '1.1rem' }}>تعديل بيانات الحجز رقم {editBooking.id}</h2>
            <div className="form-group" style={{ marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem' }}>الاسم</label>
              <input 
                type="text" 
                value={editBooking.name}
                onChange={e => setEditBooking({...editBooking, name: e.target.value})}
                style={{ padding: '0.4rem', fontSize: '0.9rem' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem' }}>رقم الهاتف</label>
              <input 
                type="text" 
                value={editBooking.phone}
                onChange={e => setEditBooking({...editBooking, phone: e.target.value})}
                style={{ padding: '0.4rem', fontSize: '0.9rem' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.85rem' }}>عدد التمصيرات</label>
              <input 
                type="number" 
                value={editBooking.orders}
                onChange={e => setEditBooking({...editBooking, orders: parseInt(e.target.value) || 1})}
                style={{ padding: '0.4rem', fontSize: '0.9rem' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-primary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.9rem' }} onClick={() => adminAction('edit', editBooking)}>حفظ</button>
              <button className="btn btn-outline" style={{ flex: 1, padding: '0.5rem', fontSize: '0.9rem', marginTop: 0 }} onClick={() => setEditBooking(null)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
      {showQR && (
        <div className="modal-overlay" onClick={() => setShowQR(false)}>
          <div className="modal" style={{ padding: '1.5rem', textAlign: 'center', maxWidth: '300px' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--primary)' }}>المسح للحجز</h2>
            <div style={{ background: 'white', padding: '1rem', borderRadius: '1rem', display: 'inline-block', marginBottom: '1rem' }}>
              <QRCodeSVG value={origin} size={200} />
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              امسح الكود لفتح صفحة الحجز للعملاء
            </p>
            <button className="btn btn-primary" onClick={() => setShowQR(false)}>إغلاق</button>
          </div>
        </div>
      )}
    </main>
  );
}
