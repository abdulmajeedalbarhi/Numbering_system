'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [state, setState] = useState({ currentNumber: 0, isOpen: true });
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', orders: '' });
  const [bookingResult, setBookingResult] = useState<any>(null);

  const fetchState = async () => {
    try {
      const res = await fetch('/api/queue');
      const data = await res.json();
      setState({ currentNumber: data.currentNumber, isOpen: data.isOpen });
    } catch (err) {
      console.error('Failed to fetch state', err);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'book', ...formData }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error === 'Queue is closed' ? 'عذراً، نظام الحجز مغلق حالياً' : data.error);
      } else {
        setBookingResult(data);
        fetchState();
      }
    } catch (err) {
      alert('حدث خطأ أثناء الحجز');
    }
  };

  return (
    <main>
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 className="title">كشخة البارحي</h1>
        <p className="subtitle">سر التمصيرة العمانية</p>
      </header>

      <section className="card">
        <div className={`status-badge ${state.isOpen ? 'status-open' : 'status-closed'}`}>
          {state.isOpen ? 'النظام مفتوح' : 'النظام مغلق'}
        </div>
        
        <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>الرقم الحالي</p>
        <div className="number-display">
          {state.currentNumber || '-'}
        </div>

        {state.isOpen && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            إضافة حجز جديد
          </button>
        )}
      </section>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            {!bookingResult ? (
              <>
                <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>تفاصيل الحجز</h2>
                <form onSubmit={handleBook}>
                  <div className="form-group">
                    <label>الاسم</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="أدخل اسمك"
                    />
                  </div>
                  <div className="form-group">
                    <label>رقم الهاتف</label>
                    <input 
                      type="tel" 
                      required 
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      placeholder="9XXXXXXX"
                    />
                  </div>
                  <div className="form-group">
                    <label>عدد الطلبات</label>
                    <input 
                      type="number" 
                      required 
                      value={formData.orders}
                      onChange={e => setFormData({...formData, orders: e.target.value})}
                      placeholder="1"
                    />
                  </div>
                  <button type="submit" className="btn btn-primary">تأكيد الحجز</button>
                  <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>إلغاء</button>
                </form>
              </>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                <h2 style={{ marginBottom: '1rem' }}>تم الحجز بنجاح!</h2>
                <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>رقمك هو:</p>
                <div className="number-display" style={{ margin: '1rem 0', fontSize: '4rem' }}>
                  {bookingResult.id}
                </div>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>يرجى الانتظار حتى يتم مناداة رقمك</p>
                <button className="btn btn-primary" onClick={() => {
                  setShowModal(false);
                  setBookingResult(null);
                  setFormData({ name: '', phone: '', orders: '' });
                }}>
                  حسناً
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
