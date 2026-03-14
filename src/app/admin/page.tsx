'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Admin() {
  const [state, setState] = useState<any>(null);
  const [auth, setAuth] = useState<any>(null);
  const router = useRouter();

  const fetchState = async (credentials: any) => {
    try {
      const res = await fetch('/api/queue');
      const data = await res.json();
      setState(data);
    } catch (err) {
      console.error('Failed to fetch state', err);
    }
  };

  useEffect(() => {
    const session = localStorage.getItem('admin_session') || sessionStorage.getItem('admin_session');
    if (!session) {
      router.push('/login');
      return;
    }
    const [user, pass] = atob(session).split(':');
    const creds = { username: user, password: pass };
    setAuth(creds);
    fetchState(creds);
    const interval = setInterval(() => fetchState(creds), 3000);
    return () => clearInterval(interval);
  }, [router]);

  const adminAction = async (action: string) => {
    if (!auth) return;
    try {
      const res = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...auth }),
      });
      if (res.ok) {
        fetchState(auth);
      } else {
        alert('حدث خطأ في تنفيذ العملية');
      }
    } catch (err) {
      alert('حدث خطأ في الاتصال');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_session');
    sessionStorage.removeItem('admin_session');
    router.push('/login');
  };

  if (!state) return <div style={{ padding: '2rem', textAlign: 'center' }}>جاري التحميل...</div>;

  return (
    <main style={{ maxWidth: '800px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="title" style={{ fontSize: '2rem' }}>لوحة التحكم</h1>
          <p className="subtitle">إدارة نظام الترقيم</p>
        </div>
        <button className="btn btn-outline" style={{ width: 'auto', padding: '0.5rem 1rem' }} onClick={handleLogout}>
          خروج
        </button>
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
              </tr>
            </thead>
            <tbody>
              {state.bookings.filter((b: any) => b.id > state.currentNumber).map((booking: any) => (
                <tr key={booking.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem', fontWeight: 800 }}>{booking.id}</td>
                  <td style={{ padding: '1rem' }}>{booking.name}</td>
                  <td style={{ padding: '1rem' }}>{booking.phone}</td>
                  <td style={{ padding: '1rem' }}>{booking.orders}</td>
                </tr>
              ))}
              {state.bookings.filter((b: any) => b.id > state.currentNumber).length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
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
    </main>
  );
}
