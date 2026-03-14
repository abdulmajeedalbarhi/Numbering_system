'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const session = localStorage.getItem('admin_session');
    if (session) {
      router.push('/admin');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', username, password }),
      });
      
      if (res.ok) {
        if (rememberMe) {
          localStorage.setItem('admin_session', btoa(`${username}:${password}`));
        } else {
          sessionStorage.setItem('admin_session', btoa(`${username}:${password}`));
        }
        router.push('/admin');
      } else {
        alert('بيانات الدخول غير صحيحة');
      }
    } catch (err) {
      alert('حدث خطأ أثناء تسجيل الدخول');
    }
  };

  return (
    <main>
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 className="title">دخول المشرف</h1>
        <p className="subtitle">كشخة البارحي</p>
      </header>

      <section className="card">
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>اسم المستخدم</label>
            <input 
              type="text" 
              required 
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="username"
            />
          </div>
          <div className="form-group">
            <label>كلمة المرور</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="password"
            />
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <label htmlFor="remember" style={{ margin: 0, cursor: 'pointer' }}>تذكرني</label>
            <input 
              id="remember"
              type="checkbox" 
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              style={{ width: 'auto' }}
            />
          </div>
          <button type="submit" className="btn btn-primary">دخول</button>
        </form>
      </section>
    </main>
  );
}
