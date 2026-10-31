'use client';

import { useEffect, useState } from 'react';
import { TradeType } from '@/lib/types';

interface Props {
  title: string; // ชื่อหมวด/หมวดย่อยที่กดมา
  orderIds: string[];
  tradeType: TradeType;
  onClose: () => void;
}

// หน้าต่างแสดงเลขออเดอร์ทั้งหมดของ 1 เซลล์ พร้อมค้นหาและคัดลอก
// ตัวแม่ (SummaryTable) render component นี้เฉพาะตอนเปิด จึงเริ่มด้วยช่องค้นหาว่างทุกครั้ง
export default function OrderIdsModal({ title, orderIds, tradeType, onClose }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // กด Esc เพื่อปิด + ล็อกการเลื่อนหน้าหลักระหว่างเปิด
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const tradeLabel = tradeType === 'buy' ? 'ฝั่งซื้อ' : 'ฝั่งขาย';
  const visibleOrderIds = orderIds.filter((orderId) =>
    orderId.toLowerCase().includes(searchTerm.trim().toLowerCase()),
  );

  const copyAllOrderIds = async () => {
    try {
      await navigator.clipboard.writeText(orderIds.join('\n'));
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // clipboard ใช้ไม่ได้ (เช่น เปิดผ่าน http ที่ไม่ใช่ localhost) — ผู้ใช้ยังเลือกข้อความคัดลอกเองได้
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-tag-row">
              <span className={`modal-badge ${tradeType}`}>{tradeLabel}</span>
              <span className="modal-count">{orderIds.length} ออเดอร์</span>
            </div>
            <h3 id="modal-title" className="modal-title">{title}</h3>
            <p className="modal-subtitle">รายการเลขออเดอร์{tradeLabel}ทั้งหมด</p>
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
                onChange={(event) => setSearchTerm(event.target.value)}
                autoFocus
              />
              {searchTerm && (
                <button type="button" className="clear-search-btn" onClick={() => setSearchTerm('')} aria-label="ล้างคำค้นหา">
                  ✕
                </button>
              )}
            </div>

            <button type="button" className="copy-btn" onClick={copyAllOrderIds}>
              {isCopied ? (
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
            {visibleOrderIds.length === 0 ? (
              <p className="modal-empty">ไม่พบเลขออเดอร์ที่ตรงกับ &quot;{searchTerm}&quot;</p>
            ) : (
              <div className="id-grid">
                {visibleOrderIds.map((orderId, index) => (
                  <div key={orderId} className="id-item">
                    <span className="id-index">{index + 1}.</span>
                    <code className="id-code">{orderId}</code>
                    <button
                      type="button"
                      className="id-copy-single"
                      title="คัดลอกเลขออเดอร์นี้"
                      aria-label={`คัดลอก ${orderId}`}
                      onClick={() => navigator.clipboard.writeText(orderId).catch(() => {})}
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
