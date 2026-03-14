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
    <main>
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 className="title">كشخة البارحي</h1>
        <p className="subtitle">سر التمصيرة العمانية</p>
      </header>

      <section className="card">
        <div className={`status-badge ${!state.isOpen ? 'status-closed' : isFull ? 'status-closed' : 'status-open'}`}
             style={{ backgroundColor: state.isOpen && isFull ? '#fefce8' : '', color: state.isOpen && isFull ? '#854d0e' : '' }}>
          {!state.isOpen ? 'النظام مغلق' : isFull ? 'اكتملت الحجوزات لهذا اليوم' : 'النظام مفتوح'}
        </div>
        
        <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>الرقم الحالي</p>
        <div className="number-display">
          {state.currentNumber || '-'}
        </div>

        {state.isOpen && (
          <button 
            className="btn btn-primary" 
            onClick={() => setShowModal(true)}
            disabled={isFull}
            style={{ opacity: isFull ? 0.5 : 1, cursor: isFull ? 'not-allowed' : 'pointer' }}
          >
            {isFull ? 'عذراً، لا يوجد حجز متاح' : 'إضافة حجز جديد'}
          </button>
        )}
      </section>

      <section className="search-section">
        <h3 style={{ color: 'var(--primary)' }}>الاستعلام عن حجز</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>أدخل الاسم أو رقم الهاتف للتأكد من رقمك</p>
        <div className="search-input-group">
          <input 
            type="text" 
            placeholder="الاسم أو رقم الهاتف..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button className="btn btn-primary" onClick={handleSearch}>بحث</button>
        </div>

        {searchResult && (
          <div className="result-card" style={{ backgroundColor: searchResult.isDone ? '#f8fafc' : '#f0fdf4', borderColor: searchResult.isDone ? '#e2e8f0' : '#bbf7d0' }}>
            <p><strong>الاسم:</strong> {searchResult.name}</p>
            <p><strong>أرقام الحجز:</strong> <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.2rem' }}>{searchResult.ids.join(', ')}</span></p>
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
              {searchResult.isDone ? (
                <p style={{ color: '#64748b' }}>تمت مناداة جميع أرقامك بنجاح ✅</p>
              ) : (
                <>
                  <p style={{ fontSize: '1.1rem' }}>
                    عدد الأشخاص أمامك: <span style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '1.4rem' }}>{searchResult.peopleInFront}</span>
                  </p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    سيتم مناداتك عند الوصول للرقم {searchResult.firstId}
                  </p>
                </>
              )}
            </div>
          </div>
        )}
        {searchError && <p style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>{searchError}</p>}
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
                      placeholder="أدخل اسمك الكامل"
                    />
                  </div>
                  <div className="form-group">
                    <label>رقم الهاتف</label>
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
                        placeholder="XXXXXXXX"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>عدد الأشخاص (الطلبات)</label>
                    <div className="order-counter">
                      <button type="button" className="counter-btn" onClick={() => setFormData({...formData, orders: Math.max(1, formData.orders - 1)})}>-</button>
                      <span className="counter-value">{formData.orders}</span>
                      <button type="button" className="counter-btn" onClick={() => setFormData({...formData, orders: formData.orders + 1})}>+</button>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>سيتم حجز {formData.orders} أرقام متتالية لك</p>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>تأكيد الحجز</button>
                  <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>إلغاء</button>
                </form>
              </>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                <h2 style={{ marginBottom: '1rem' }}>تم الحجز بنجاح!</h2>
                <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>أرقامك هي:</p>
                <div className="number-display" style={{ margin: '1rem 0', fontSize: bookingResult.length > 2 ? '2.5rem' : '4rem' }}>
                  {bookingResult.length > 1 
                    ? `${bookingResult[0].id} - ${bookingResult[bookingResult.length - 1].id}`
                    : bookingResult[0].id
                  }
                </div>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>لقد قمت بحجز {bookingResult.length} أرقام. يرجى الانتظار حتى مناداة أول رقم لك.</p>
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
