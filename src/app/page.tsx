'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [state, setState] = useState({ currentNumber: 0, isOpen: true, maxBookings: 100, bookingCount: 0, bookings: [] as any[] });
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', orders: 1 });
  const [bookingResult, setBookingResult] = useState<any>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchError, setSearchError] = useState('');

  const fetchState = async () => {
    try {
      const res = await fetch('/api/queue');
      const data = await res.json();
      setState({ 
        currentNumber: data.currentNumber, 
        isOpen: data.isOpen, 
        maxBookings: data.maxBookings,
        bookingCount: data.bookings.length,
        bookings: data.bookings
      });
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
    if (formData.phone.length !== 8) {
      alert('يرجى إدخال رقم هاتف عماني صحيح (8 أرقام)');
      return;
    }
    try {
      const res = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'book', ...formData }),
      });
      const data = await res.json();
      if (data.error) {
        let msg = data.error;
        if (msg === 'Queue is closed') msg = 'عذراً، نظام الحجز مغلق حالياً';
        alert(msg);
      } else {
        setBookingResult(data);
        fetchState();
      }
    } catch (err) {
      alert('حدث خطأ أثناء الحجز');
    }
  };

  const handleSearch = () => {
    setSearchError('');
    setSearchResult(null);
    if (!searchQuery) return;

    // Support search by exact phone or name
    const matches = state.bookings.filter((b: any) => 
      b.phone === searchQuery || b.name === searchQuery || b.name.includes(searchQuery)
    );

    if (matches.length > 0) {
      const sorted = matches.sort((a: any, b: any) => a.id - b.id);
      const firstAvailable = sorted.find((b: any) => b.id > state.currentNumber) || sorted[sorted.length - 1];
      
      // Calculate total IDs in front (as requested)
      const peopleAhead = Math.max(0, firstAvailable.id - state.currentNumber - 1);

      setSearchResult({
        name: sorted[0].name,
        ids: sorted.map((b: any) => b.id),
        firstId: firstAvailable.id,
        peopleInFront: peopleAhead,
        isDone: sorted.every((b: any) => b.id <= state.currentNumber)
      });
    } else {
      setSearchError('عذراً، لم يتم العثور على حجز بهذا الاسم أو الرقم');
    }
  };

  const isFull = state.bookingCount >= state.maxBookings;

  return (
    <main style={{ padding: '0.5rem 0.5rem' }}>
      <header style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
        <h1 className="title" style={{ fontSize: '1.75rem', marginBottom: '0.1rem' }}>كشخة البارحي</h1>
        <p className="subtitle" style={{ fontSize: '0.85rem', marginBottom: '0' }}>سر الكشخة العمانية</p>
      </header>

      <section className="card" style={{ padding: '0.75rem 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
          <div className={`status-badge ${!state.isOpen ? 'status-closed' : isFull ? 'status-closed' : 'status-open'}`}
               style={{ 
                 padding: '0.2rem 0.6rem', 
                 fontSize: '0.75rem',
                 backgroundColor: state.isOpen && isFull ? '#fefce8' : '', 
                 color: state.isOpen && isFull ? '#854d0e' : '' 
               }}>
            {!state.isOpen ? 'النظام مغلق' : isFull ? 'تم الاكتمال' : 'النظام مفتوح'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            محجوز <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{state.bookingCount}</span> / <span style={{ fontWeight: 800 }}>{state.maxBookings}</span>
          </div>
        </div>
        
        <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.8rem', marginBottom: '0' }}>الرقم الحالي</p>
        <div className="number-display" style={{ fontSize: '3.75rem', margin: '0.25rem 0' }}>
          {state.currentNumber || '-'}
        </div>

        {state.isOpen && (
          <button 
            className="btn btn-primary" 
            onClick={() => setShowModal(true)}
            disabled={isFull}
            style={{ 
              opacity: isFull ? 0.5 : 1, 
              cursor: isFull ? 'not-allowed' : 'pointer',
              padding: '0.6rem',
              fontSize: '1rem',
              marginTop: '0.25rem'
            }}
          >
            {isFull ? 'عذراً، لا يوجد حجز متاح' : 'إضافة حجز جديد'}
          </button>
        )}
      </section>

      <section className="search-section" style={{ marginTop: '0.75rem', padding: '0.75rem 1rem' }}>
        <h3 style={{ color: 'var(--primary)', fontSize: '1rem', marginBottom: '0.25rem' }}>الاستعلام عن حجز</h3>
        <div className="search-input-group" style={{ margin: '0.4rem 0' }}>
          <input 
            type="text" 
            placeholder="الاسم أو الهاتف..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            style={{ padding: '0.5rem', fontSize: '0.85rem' }}
          />
          <button className="btn btn-primary" onClick={handleSearch} style={{ padding: '0 0.75rem', fontSize: '0.85rem' }}>بحث</button>
        </div>

        {searchResult && (
          <div className="result-card" style={{ padding: '0.5rem 0.75rem', marginTop: '0.25rem', backgroundColor: searchResult.isDone ? '#f8fafc' : '#f0fdf4' }}>
            <p style={{ fontSize: '0.85rem', marginBottom: '0.2rem' }}><strong>الاسم:</strong> {searchResult.name}</p>
            <p style={{ fontSize: '0.85rem', marginBottom: '0.2rem' }}><strong>الأرقام:</strong> <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{searchResult.ids.join(', ')}</span></p>
            {!searchResult.isDone && (
              <p style={{ fontSize: '0.9rem', marginTop: '0.25rem', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '0.25rem' }}>
                عدد التمصيرات أمامك: <span style={{ color: 'var(--primary)', fontWeight: 900 }}>{searchResult.peopleInFront}</span>
              </p>
            )}
          </div>
        )}
        {searchError && (
          <p style={{ fontSize: '0.8rem', color: 'var(--danger)', marginTop: '0.25rem' }}>{searchError}</p>
        )}
      </section>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ padding: '1rem' }}>
            {!bookingResult ? (
              <>
                <h2 style={{ marginBottom: '0.75rem', color: 'var(--primary)', fontSize: '1.1rem' }}>تفاصيل الحجز</h2>
                <form onSubmit={handleBook}>
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.85rem' }}>الاسم</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="الأسم الكامل"
                      style={{ padding: '0.5rem', fontSize: '0.9rem' }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.85rem' }}>رقم الهاتف</label>
                    <div className="phone-input-wrapper" style={{ height: '38px' }}>
                      <span className="phone-prefix" style={{ fontSize: '0.85rem' }}>+968</span>
                      <input 
                        type="tel" 
                        required 
                        maxLength={8}
                        value={formData.phone}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (val.length <= 8) setFormData({...formData, phone: val});
                        }}
                        style={{ padding: '0.5rem', fontSize: '0.9rem' }}
                      />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label style={{ fontSize: '0.85rem' }}>عدد التمصيرات</label>
                    <div className="order-counter" style={{ padding: '0.25rem' }}>
                      <button type="button" className="counter-btn" style={{ width: '28px', height: '28px' }} onClick={() => setFormData({...formData, orders: Math.max(1, formData.orders - 1)})}>-</button>
                      <span className="counter-value" style={{ fontSize: '1rem' }}>{formData.orders}</span>
                      <button type="button" className="counter-btn" style={{ width: '28px', height: '28px' }} onClick={() => setFormData({...formData, orders: formData.orders + 1})}>+</button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 2, padding: '0.6rem', fontSize: '0.95rem' }}>تأكيد الحجز</button>
                    <button type="button" className="btn btn-outline" style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', marginTop: '0' }} onClick={() => setShowModal(false)}>إلغاء</button>
                  </div>
                </form>
              </>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>✅</div>
                <h2 style={{ marginBottom: '0.25rem', fontSize: '1.1rem' }}>تم الحجز بنجاح!</h2>
                <p style={{ fontSize: '0.9rem' }}>أرقامك هي:</p>
                <div className="number-display" style={{ margin: '0.25rem 0', fontSize: bookingResult.length > 2 ? '1.75rem' : '3rem' }}>
                  {bookingResult.length > 1 
                    ? `${bookingResult[0].id} - ${bookingResult[bookingResult.length - 1].id}`
                    : bookingResult[0].id
                  }
                </div>
                <button className="btn btn-primary" onClick={() => {
                  setShowModal(false);
                  setBookingResult(null);
                  setFormData({ name: '', phone: '', orders: 1 });
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
