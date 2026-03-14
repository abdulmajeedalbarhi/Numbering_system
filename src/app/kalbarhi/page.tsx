'use client';

import { useState, useEffect } from 'react';

export default function Admin() {
  const [state, setState] = useState<any>(null);
  const [editBooking, setEditBooking] = useState<any>(null);

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
    <main style={{ maxWidth: '800px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="title" style={{ fontSize: '2rem' }}>لوحة التحكم</h1>
          <p className="subtitle">إدارة نظام الترقيم</p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <section className="card">
          <p style={{ color: 'var(--text-muted)' }}>الرقم الحالي</p>
          <div className="number-display" style={{ fontSize: '4rem', margin: '1rem 0' }}>
            {state.currentNumber || '-'}
          </div>
          <button className="btn btn-primary" onClick={() => adminAction('next')}>
            العميل التالي
          </button>
        </section>

        <section className="card">
          <p style={{ color: 'var(--text-muted)' }}>حالة النظام</p>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '2rem 0' }}>
            {state.isOpen ? 'مفتوح للجمهور' : 'مغلق حالياً'}
          </div>
          <button 
            className={`btn ${state.isOpen ? 'btn-outline' : 'btn-primary'}`} 
            style={{ borderColor: state.isOpen ? 'var(--danger)' : '', color: state.isOpen ? 'var(--danger)' : '' }}
            onClick={() => adminAction('toggle')}
          >
            {state.isOpen ? 'إغلاق الحجز' : 'فتح الحجز'}
          </button>
        </section>

        <section className="card" style={{ gridColumn: 'span 2' }}>
          <p style={{ color: 'var(--text-muted)' }}>الحد الأقصى للحجوزات</p>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'center', margin: '1rem 0' }}>
            <input 
              type="number" 
              value={state.maxBookings}
              onChange={(e) => adminAction('setLimit', { limit: e.target.value })}
              style={{ width: '100px', textAlign: 'center', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
            />
            <span style={{ fontWeight: 600 }}>حجز</span>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>سيتم منع الحجوزات بعد الوصول لهذا الرقم</p>
        </section>
      </div>

      <section className="card" style={{ textAlign: 'right' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>قائمة الانتظار ({state.bookings.filter((b: any) => b.id > state.currentNumber).length})</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '1rem', textAlign: 'right' }}>الرقم</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>الاسم</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>الهاتف</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>الطلبات</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>التحكم</th>
              </tr>
            </thead>
            <tbody>
              {state.bookings.filter((b: any) => b.id > state.currentNumber).map((booking: any) => (
                <tr key={booking.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem', fontWeight: 800 }}>{booking.id}</td>
                  <td style={{ padding: '1rem' }}>{booking.name}</td>
                  <td style={{ padding: '1rem' }}>{booking.phone}</td>
                  <td style={{ padding: '1rem' }}>{booking.orders}</td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button 
                        className="btn btn-outline" 
                        style={{ width: 'auto', padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
                        onClick={() => setEditBooking(booking)}
                      >
                        تعديل
                      </button>
                      <button 
                        className="btn btn-outline" 
                        style={{ width: 'auto', padding: '0.25rem 0.75rem', fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}
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
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    لا يوجد عملاء في الانتظار
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <button 
          className="btn btn-outline" 
          style={{ marginTop: '2rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}
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
          <div className="modal">
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>تعديل بيانات الحجز رقم {editBooking.id}</h2>
            <div className="form-group">
              <label>الاسم</label>
              <input 
                type="text" 
                value={editBooking.name}
                onChange={e => setEditBooking({...editBooking, name: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>رقم الهاتف</label>
              <input 
                type="text" 
                value={editBooking.phone}
                onChange={e => setEditBooking({...editBooking, phone: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>عدد الطلبات</label>
              <input 
                type="number" 
                value={editBooking.orders}
                onChange={e => setEditBooking({...editBooking, orders: parseInt(e.target.value) || 1})}
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button className="btn btn-primary" onClick={() => adminAction('edit', editBooking)}>حفظ التعديلات</button>
              <button className="btn btn-outline" onClick={() => setEditBooking(null)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
