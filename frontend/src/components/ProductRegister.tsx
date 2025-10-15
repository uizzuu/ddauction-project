import { useState } from 'react';
import type { User } from '../types';

type Props = {
  setPage: (page: 'main' | 'login' | 'signup' | 'register' | 'list') => void;
  user: User | null;
};

const containerStyle = {
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '20px',
  color: 'white',
};

const formBoxStyle = {
  background: '#2a2a2a',
  padding: '40px',
  borderRadius: '12px',
  width: '100%',
  maxWidth: '600px',
  border: '1px solid #444',
};

const inputStyle = {
  width: '100%',
  padding: '12px',
  marginBottom: '15px',
  background: '#1a1a1a',
  border: '1px solid #444',
  borderRadius: '6px',
  color: 'white',
  fontSize: '16px',
  boxSizing: 'border-box' as const,
};

const buttonStyle = {
  padding: '12px 24px',
  background: '#000',
  color: 'white',
  border: '1px solid #fff',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '16px',
  fontWeight: 'bold',
};

export default function ProductRegister({ setPage, user }: Props) {
  const [form, setForm] = useState({ title: '', description: '', startPrice: '', endDate: '' });
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!user) {
      alert('로그인이 필요합니다');
      setPage('login');
      return;
    }
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (response.ok) {
        alert('물품 등록 성공!');
        setPage('list');
      } else setError('물품 등록 실패');
    } catch {
      setError('서버 연결 실패');
    }
  };

  return (
    <div style={containerStyle}>
      <div style={formBoxStyle}>
        <h2 style={{ fontSize: '32px', marginBottom: '30px' }}>물품 등록</h2>

        <input type="text" placeholder="물품명" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} />
        <textarea placeholder="상세 설명" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }} />
        <input type="number" placeholder="시작 가격" value={form.startPrice} onChange={(e) => setForm({ ...form, startPrice: e.target.value })} style={inputStyle} />
        <input type="datetime-local" placeholder="경매 종료일시" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} style={inputStyle} />

        {error && <p style={{ color: '#ff4444', marginBottom: '10px' }}>{error}</p>}

        <button onClick={handleSubmit} style={{ ...buttonStyle, width: '100%', marginTop: '20px' }}>등록하기</button>
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button onClick={() => setPage('main')} style={{ color: '#999', background: 'none', border: 'none', cursor: 'pointer' }}>취소</button>
        </div>
      </div>
    </div>
  );
}
