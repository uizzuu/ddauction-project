import { useState, useEffect } from 'react';
import type { Product, Page } from '../types';

type Props = {
  setPage: (page: Page) => void;
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

export default function ProductList({ setPage }: Props) {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/products');
        if (res.ok) {
          const data: Product[] = await res.json();
          setProducts(data);
        } else {
          console.error('상품 불러오기 실패');
        }
      } catch (err) {
        console.error('서버 연결 실패', err);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div style={{ color: 'white', padding: '20px', minHeight: '100vh', background: '#000' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '2px solid #333' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => setPage('main')}>
          ⚡ 땅땅옥션
        </h1>
        <button onClick={() => setPage('main')} style={buttonStyle}>
          메인으로
        </button>
      </header>

      <div style={{ maxWidth: '1200px', margin: '40px auto' }}>
        <h2 style={{ fontSize: '28px', marginBottom: '30px' }}>진행중인 경매</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {products.map((product) => (
            <div key={product.id} style={{ background: '#2a2a2a', padding: '20px', borderRadius: '8px', border: '1px solid #444' }}>
              <div style={{ width: '100%', height: '200px', background: '#1a1a1a', marginBottom: '15px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                이미지
              </div>
              <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>{product.title}</h3>
              <p style={{ color: '#ffcc00', fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>
                {product.price?.toLocaleString()}원
              </p>
              <p style={{ color: '#999', marginBottom: '15px' }}>
                종료: {new Date(product.auctionEndTime).toLocaleString()}
              </p>
              <button style={{ ...buttonStyle, width: '100%' }}>입찰하기</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
