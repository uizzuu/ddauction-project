import { useState } from 'react';
import type { Page } from '../types';

type Props = {
  setPage: (page: Page) => void;
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

export default function Signup({ setPage }: Props) {
  const [form, setForm] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    passwordConfirm: '' 
  });
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (form.password !== form.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: form.username, 
          email: form.email, 
          password: form.password 
        }),
      });

      if (response.ok) {
        alert('회원가입 성공!');
        setPage('login');
      } else {
        setError('회원가입 실패');
      }
    } catch {
      setError('서버 연결 실패');
    }
  };

  return (
    <div style={containerStyle}>
      <div style={formBoxStyle}>
        <h2 style={{ fontSize: '32px', marginBottom: '30px' }}>회원가입</h2>

        <input 
          type="text" 
          placeholder="아이디" 
          value={form.username} 
          onChange={(e) => setForm({ ...form, username: e.target.value })} 
          style={inputStyle} 
        />
        <input 
          type="email" 
          placeholder="이메일" 
          value={form.email} 
          onChange={(e) => setForm({ ...form, email: e.target.value })} 
          style={inputStyle} 
        />
        <input 
          type="password" 
          placeholder="비밀번호" 
          value={form.password} 
          onChange={(e) => setForm({ ...form, password: e.target.value })} 
          style={inputStyle} 
        />
        <input 
          type="password" 
          placeholder="비밀번호 확인" 
          value={form.passwordConfirm} 
          onChange={(e) => setForm({ ...form, passwordConfirm: e.target.value })} 
          style={inputStyle} 
        />

        {error && <p style={{ color: '#ff4444', marginBottom: '10px' }}>{error}</p>}

        <button 
          onClick={handleSubmit} 
          style={{ ...buttonStyle, width: '100%', marginTop: '20px' }}
        >
          회원가입
        </button>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button 
            onClick={() => setPage('login')} 
            style={{ color: '#999', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            로그인하기
          </button>
          <span style={{ margin: '0 10px', color: '#666' }}>|</span>
          <button 
            onClick={() => setPage('main')} 
            style={{ color: '#999', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            메인으로
          </button>
        </div>
      </div>
    </div>
  );
}