import Link from "next/link";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <section>
          <h2>Đặt Vé Xe</h2>
          <p>
            Nền tảng hỗ trợ tìm chuyến, chọn ghế, đặt vé và quản lý vé xe khách trực tuyến.
          </p>
        </section>

        <section>
          <h3>Hành khách</h3>
          <Link href="/">Tìm chuyến xe</Link>
          <Link href="/tickets/lookup">Tra cứu vé</Link>
          <Link href="/account/tickets">Vé của tôi</Link>
        </section>

        <section>
          <h3>Đối tác</h3>
          <Link href="/partners/apply">Đăng ký mở bán vé</Link>
          <Link href="/partner">Dashboard nhà xe</Link>
          <Link href="/login">Đăng nhập</Link>
        </section>

        <section>
          <h3>Liên hệ</h3>
          <p>Email: hotro@datvexe.local</p>
          <p>Hotline: 1900 0000</p>
          <p>Thời gian hỗ trợ: 08:00 - 22:00</p>
        </section>
      </div>

      <div className="footer-bottom">
        <span>© 2026 Đặt Vé Xe. Phục vụ mục tiêu học tập và báo cáo luận văn.</span>
      </div>
    </footer>
  );
}
