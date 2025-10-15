import { useState } from 'react';
import type { User, Page } from '../types';

type Props = {
  setPage: (page: Page) => void;
  setUser: (user: User) => void;
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
  maxWidth: '400px',
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

export default function Login({ setPage, setUser }: Props) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data);
        setPage('main');
      } else {
        setError('로그인 실패');
      }
    } catch {
      setError('서버 연결 실패');
    }
  };

  return (
    <div style={containerStyle}>
      <div style={formBoxStyle}>
        <h2 style={{ fontSize: '32px', marginBottom: '30px' }}>로그인</h2>

        <input
          type="text"
          placeholder="아이디"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          style={inputStyle}
        />

        {error && <p style={{ color: '#ff4444', marginBottom: '10px' }}>{error}</p>}

        <button onClick={handleSubmit} style={{ ...buttonStyle, width: '100%', marginTop: '20px' }}>
          로그인
        </button>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button onClick={() => setPage('signup')} style={{ color: '#999', background: 'none', border: 'none', cursor: 'pointer' }}>
            회원가입하기
          </button>
          <span style={{ margin: '0 10px', color: '#666' }}>|</span>
          <button onClick={() => setPage('main')} style={{ color: '#999', background: 'none', border: 'none', cursor: 'pointer' }}>
            메인으로
          </button>
        </div>
      </div>
    </div>
  );
}