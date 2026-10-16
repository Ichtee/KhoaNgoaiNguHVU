import React from 'react';
import { Sparkles, Github, Twitter, Linkedin, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      marginTop: '5rem',
      background: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border-subtle)',
      padding: '4rem 0 2rem 0'
    }}>
      <div className="container">
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2.5rem',
          marginBottom: '3rem'
        }}>
          
          {/* Brand Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--accent-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}>
                <Sparkles size={18} />
              </div>
              <h3 style={{ fontSize: '1.3rem' }}>
                Dev<span className="gradient-text">Sphere</span>
              </h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Nền tảng Blog công nghệ MERN Stack chất lượng cao, nơi chia sẻ kiến thức lập trình Web, Kiến trúc Hệ thống và Trí tuệ nhân tạo.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-main)' }}>Chủ Đề Nổi Bật</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <li>• Lập trình ReactJS & Next.js</li>
              <li>• Node.js & RESTful APIs</li>
              <li>• MongoDB Aggregation & Schema</li>
              <li>• Công cụ AI & Agentic Coding</li>
            </ul>
          </div>

          {/* Tech Stack */}
          <div>
            <h4 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-main)' }}>Công Nghệ Triển Khai</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <li>• <strong>Backend:</strong> Express.js & Node.js API</li>
              <li>• <strong>Database:</strong> MongoDB / Mongoose</li>
              <li>• <strong>Frontend:</strong> React.js & Vite</li>
              <li>• <strong>Auth:</strong> JWT & Bcrypt Password Hashing</li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright */}
        <div style={{
          paddingTop: '2rem',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.88rem',
          color: 'var(--text-muted)'
        }}>
          <div>
            © 2026 <strong>DevSphere Blog</strong>. Phát triển với <Heart size={14} color="#ef4444" fill="#ef4444" style={{ display: 'inline' }} /> MERN Stack.
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Github size={18} style={{ cursor: 'pointer' }} />
            <Twitter size={18} style={{ cursor: 'pointer' }} />
            <Linkedin size={18} style={{ cursor: 'pointer' }} />
          </div>
        </div>

      </div>
    </footer>
  );
}
