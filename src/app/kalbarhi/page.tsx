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
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 className="title" style={{ fontSize: '1.8rem' }}>لوحة التحكم</h1>
          <p className="subtitle" style={{ marginBottom: '0', fontSize: '1rem' }}>إدارة نظام الترقيم</p>
        </div>
      </header>

      <div className="admin-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <section className="card" style={{ padding: '1rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>الرقم الحالي</p>
          <div className="number-display" style={{ fontSize: '3rem', margin: '0.5rem 0' }}>
            {state.currentNumber || '-'}
          </div>
          <button className="btn btn-primary" onClick={() => adminAction('next')} style={{ padding: '0.6rem', fontSize: '0.9rem' }}>
            العميل التالي
          </button>
        </section>

        <section className="card" style={{ padding: '1rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>حالة النظام</p>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.75rem 0' }}>
            {state.isOpen ? 'مفتوح للجمهور' : 'مغلق حالياً'}
          </div>
          <button 
            className={`btn ${state.isOpen ? 'btn-outline' : 'btn-primary'}`} 
            style={{ 
              borderColor: state.isOpen ? 'var(--danger)' : '', 
              color: state.isOpen ? 'var(--danger)' : '', 
              padding: '0.6rem', 
              fontSize: '0.9rem',
              marginTop: '0' 
            }}
            onClick={() => adminAction('toggle')}
          >
            {state.isOpen ? 'إغلاق الحجز' : 'فتح الحجز'}
          </button>
        </section>

        <section className="card" style={{ gridColumn: 'span 2', padding: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>الحد الأقصى:</span>
            <input 
              type="number" 
              value={state.maxBookings}
              onChange={(e) => adminAction('setLimit', { limit: e.target.value })}
              style={{ width: '70px', textAlign: 'center', padding: '0.3rem', borderRadius: '0.5rem', border: '1px solid var(--border)', fontSize: '0.9rem' }}
            />
            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>حجز</span>
          </div>
        </section>
      </div>

      <section className="card" style={{ textAlign: 'right', padding: '1rem' }}>
        <h2 style={{ marginBottom: '0.75rem', fontSize: '1.1rem' }}>قائمة الانتظار ({state.bookings.filter((b: any) => b.id > state.currentNumber).length})</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '0.5rem', textAlign: 'right' }}>الرقم</th>
                <th style={{ padding: '0.5rem', textAlign: 'right' }}>الاسم</th>
                <th style={{ padding: '0.5rem', textAlign: 'right' }}>الهاتف</th>
                <th style={{ padding: '0.5rem', textAlign: 'center' }}>التحكم</th>
              </tr>
            </thead>
            <tbody>
              {state.bookings.filter((b: any) => b.id > state.currentNumber).map((booking: any) => (
                <tr key={booking.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.5rem', fontWeight: 800 }}>{booking.id}</td>
                  <td style={{ padding: '0.5rem' }}>{booking.name}</td>
                  <td style={{ padding: '0.5rem' }}>{booking.phone}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
                      <button 
                        className="btn btn-outline" 
                        style={{ width: 'auto', padding: '0.15rem 0.4rem', fontSize: '0.7rem', marginTop: 0 }}
                        onClick={() => setEditBooking(booking)}
                      >
                        تعديل
                      </button>
                      <button 
                        className="btn btn-outline" 
                        style={{ width: 'auto', padding: '0.15rem 0.4rem', fontSize: '0.7rem', color: 'var(--danger)', borderColor: 'var(--danger)', marginTop: 0 }}
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
                  <td colSpan={4} style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    لا يوجد عملاء في الانتظار
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <button 
          className="btn btn-outline" 
          style={{ marginTop: '1rem', color: 'var(--danger)', borderColor: 'var(--danger)', padding: '0.4rem', fontSize: '0.8rem', width: 'auto' }}
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
            <h2 style={{ marginBottom: '1rem', color: 'var(--primary)', fontSize: '1.2rem' }}>تعديل بيانات الحجز رقم {editBooking.id}</h2>
            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.9rem' }}>الاسم</label>
              <input 
                type="text" 
                value={editBooking.name}
                onChange={e => setEditBooking({...editBooking, name: e.target.value})}
                style={{ padding: '0.5rem' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.9rem' }}>رقم الهاتف</label>
              <input 
                type="text" 
                value={editBooking.phone}
                onChange={e => setEditBooking({...editBooking, phone: e.target.value})}
                style={{ padding: '0.5rem' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.9rem' }}>عدد الطلبات</label>
              <input 
                type="number" 
                value={editBooking.orders}
                onChange={e => setEditBooking({...editBooking, orders: parseInt(e.target.value) || 1})}
                style={{ padding: '0.5rem' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-primary" style={{ padding: '0.5rem', fontSize: '0.9rem' }} onClick={() => adminAction('edit', editBooking)}>حفظ</button>
              <button className="btn btn-outline" style={{ padding: '0.5rem', fontSize: '0.9rem', marginTop: 0 }} onClick={() => setEditBooking(null)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
