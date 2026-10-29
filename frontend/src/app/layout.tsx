import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'สรุปยอดซื้อ–ขายรายสินค้า',
  description: 'ระบบสรุปยอดซื้อ-ขายตามหมวดหมู่และหมวดหมู่ย่อย',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
