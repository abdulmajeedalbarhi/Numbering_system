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
      
      setSearchResult({
        name: sorted[0].name,
        ids: sorted.map((b: any) => b.id),
        firstId: firstAvailable.id,
        peopleInFront: Math.max(0, firstAvailable.id - state.currentNumber - 1),
        isDone: sorted.every((b: any) => b.id <= state.currentNumber)
      });
    } else {
      setSearchError('عذراً، لم يتم العثور على حجز بهذا الاسم أو الرقم');
    }
  };

  const isFull = state.bookingCount >= state.maxBookings;

  return (
    <main style={{ padding: '1rem 0.5rem' }}>
      <header style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h1 className="title" style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>كشخة البارحي</h1>
        <p className="subtitle" style={{ fontSize: '0.9rem', marginBottom: '0' }}>سر التمصيرة العمانية</p>
      </header>

      <section className="card" style={{ padding: '1.25rem' }}>
        <div className={`status-badge ${!state.isOpen ? 'status-closed' : isFull ? 'status-closed' : 'status-open'}`}
             style={{ 
               padding: '0.3rem 0.75rem', 
               fontSize: '0.85rem',
               backgroundColor: state.isOpen && isFull ? '#fefce8' : '', 
               color: state.isOpen && isFull ? '#854d0e' : '' 
             }}>
          {!state.isOpen ? 'النظام مغلق' : isFull ? 'اكتملت الحجوزات لهذا اليوم' : 'النظام مفتوح'}
        </div>
        
        <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>الرقم الحالي</p>
        <div className="number-display" style={{ fontSize: '4.5rem', margin: '0.75rem 0' }}>
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
              padding: '0.8rem'
            }}
          >
            {isFull ? 'عذراً، لا يوجد حجز متاح' : 'إضافة حجز جديد'}
          </button>
        )}
      </section>

      <section className="search-section" style={{ marginTop: '1.5rem', padding: '1.25rem' }}>
        <h3 style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>الاستعلام عن حجز</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>أدخل الاسم أو رقم الهاتف</p>
        <div className="search-input-group" style={{ margin: '0.75rem 0' }}>
          <input 
            type="text" 
            placeholder="الرقم أو الهاتف..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            style={{ padding: '0.6rem', fontSize: '0.9rem' }}
          />
          <button className="btn btn-primary" onClick={handleSearch} style={{ padding: '0 1rem', fontSize: '0.9rem' }}>بحث</button>
        </div>

        {searchResult && (
          <div className="result-card" style={{ padding: '0.75rem', backgroundColor: searchResult.isDone ? '#f8fafc' : '#f0fdf4' }}>
            <p style={{ fontSize: '0.9rem' }}><strong>الاسم:</strong> {searchResult.name}</p>
            <p style={{ fontSize: '0.9rem' }}><strong>الأرقام:</strong> <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{searchResult.ids.join(', ')}</span></p>
            {!searchResult.isDone && (
              <p style={{ fontSize: '1rem', marginTop: '0.5rem', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '0.5rem' }}>
                أمامك: <span style={{ color: 'var(--primary)', fontWeight: 900 }}>{searchResult.peopleInFront}</span> أشخاص
              </p>
            )}
          </div>
        )}
      </section>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ padding: '1.25rem' }}>
            {!bookingResult ? (
              <>
                <h2 style={{ marginBottom: '1rem', color: 'var(--primary)', fontSize: '1.2rem' }}>تفاصيل الحجز</h2>
                <form onSubmit={handleBook}>
                  <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label style={{ fontSize: '0.9rem' }}>الاسم</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="الأسم الكامل"
                      style={{ padding: '0.6rem' }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label style={{ fontSize: '0.9rem' }}>رقم الهاتف</label>
                    <div className="phone-input-wrapper">
                      <span className="phone-prefix">+968</span>
                      <input 
                        type="tel" 
                        required 
                        maxLength={8}
                        value={formData.phone}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (val.length <= 8) setFormData({...formData, phone: val});
                        }}
                        style={{ padding: '0.6rem' }}
                      />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.9rem' }}>عدد الأشخاص</label>
                    <div className="order-counter" style={{ padding: '0.4rem' }}>
                      <button type="button" className="counter-btn" style={{ width: '32px', height: '32px' }} onClick={() => setFormData({...formData, orders: Math.max(1, formData.orders - 1)})}>-</button>
                      <span className="counter-value" style={{ fontSize: '1.1rem' }}>{formData.orders}</span>
                      <button type="button" className="counter-btn" style={{ width: '32px', height: '32px' }} onClick={() => setFormData({...formData, orders: formData.orders + 1})}>+</button>
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem', fontSize: '1rem' }}>تأكيد الحجز</button>
                  <button type="button" className="btn btn-outline" style={{ padding: '0.6rem', fontSize: '0.9rem', marginTop: '0.5rem' }} onClick={() => setShowModal(false)}>إلغاء</button>
                </form>
              </>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✅</div>
                <h2 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>تم الحجز بنجاح!</h2>
                <p style={{ fontSize: '1rem' }}>أرقامك هي:</p>
                <div className="number-display" style={{ margin: '0.5rem 0', fontSize: bookingResult.length > 2 ? '2rem' : '3.5rem' }}>
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
