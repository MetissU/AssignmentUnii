// โครงร่างจำลอง (การ์ด 3 ใบ + ตาราง) ระหว่างโหลดข้อมูลครั้งแรก ให้หน้าไม่ว่างและไม่กระโดดเมื่อข้อมูลมาถึง
export default function SkeletonLoader() {
  return (
    <div className="skeleton-container" aria-busy="true" aria-label="กำลังโหลดข้อมูล">
      <div className="skeleton-cards">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton-card shimmer">
            <div className="skeleton-line short"></div>
            <div className="skeleton-line tall"></div>
            <div className="skeleton-line medium"></div>
          </div>
        ))}
      </div>

      <div className="skeleton-table shimmer">
        <div className="skeleton-table-header"></div>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="skeleton-table-row">
            <div className="skeleton-cell w-title"></div>
            <div className="skeleton-cell"></div>
            <div className="skeleton-cell"></div>
            <div className="skeleton-cell"></div>
            <div className="skeleton-cell"></div>
            <div className="skeleton-cell"></div>
            <div className="skeleton-cell"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

