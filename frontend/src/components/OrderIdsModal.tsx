'use client';

import { useEffect, useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subTitle: string;
  orderIds: string[];
  type: 'buy' | 'sell';
}

export default function OrderIdsModal({ isOpen, onClose, title, subTitle, orderIds, type }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredIds = orderIds.filter((id) =>
    id.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(orderIds.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-tag-row">
              <span className={`modal-badge ${type}`}>
                {type === 'buy' ? 'ฝั่งซื้อ' : 'ฝั่งขาย'}
              </span>
              <span className="modal-count">{orderIds.length} ออเดอร์</span>
            </div>
            <h3 id="modal-title" className="modal-title">{title}</h3>
            {subTitle && <p className="modal-subtitle">{subTitle}</p>}
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="ปิดหน้าต่าง">
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-toolbar">
            <div className="modal-search-box">
              <svg className="modal-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                placeholder="ค้นหาเลขออเดอร์ในรายการนี้..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
              {searchTerm && (
                <button type="button" className="clear-search-btn" onClick={() => setSearchTerm('')}>
                  ✕
                </button>
              )}
            </div>

            <button type="button" className="copy-btn" onClick={handleCopyAll}>
              {copied ? (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>คัดลอกแล้ว!</span>
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  <span>คัดลอกทั้งหมด ({orderIds.length})</span>
                </>
              )}
            </button>
          </div>

          <div className="modal-id-list">
            {filteredIds.length === 0 ? (
              <p className="modal-empty">ไม่พบเลขออเดอร์ที่ตรงกับ &quot;{searchTerm}&quot;</p>
            ) : (
              <div className="id-grid">
                {filteredIds.map((id, index) => (
                  <div key={id} className="id-item">
                    <span className="id-index">{index + 1}.</span>
                    <code className="id-code">{id}</code>
                    <button
                      type="button"
                      className="id-copy-single"
                      title="คัดลอกเลขออเดอร์นี้"
                      onClick={() => navigator.clipboard.writeText(id)}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <p className="modal-footnote">กดปุ่ม Esc หรือคลิกด้านนอกเพื่อปิด</p>
          <button type="button" className="modal-done-btn" onClick={onClose}>
            ตกลง
          </button>
        </div>
      </div>
    </div>
  );
}
