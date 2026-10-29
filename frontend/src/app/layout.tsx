import type { Metadata } from 'next';
import { Noto_Sans_Thai } from 'next/font/google';
import './globals.css';

// ฟอนต์ที่รองรับภาษาไทย — ผูกกับตัวแปร CSS --font-thai (ใช้ใน globals.css)
const notoSansThai = Noto_Sans_Thai({ subsets: ['thai', 'latin'], variable: '--font-thai', display: 'swap' });

export const metadata: Metadata = {
  title: 'สรุปยอดซื้อ–ขายรายสินค้า',
  description: 'ระบบสรุปยอดซื้อ-ขายตามหมวดหมู่และหมวดหมู่ย่อย',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="th" className={notoSansThai.variable}>
      <body>{children}</body>
    </html>
  );
}
