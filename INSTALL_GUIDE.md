# Hướng Dẫn Cài Đặt Project

Tài liệu này hướng dẫn cài đặt project `Website_HoTroDatVeXe` trên máy mới.

## 1. Yêu Cầu Môi Trường

Cần cài sẵn:

- Node.js
- npm
- WAMP Server
- MySQL chạy qua WAMP
- Git

Cấu trúc project:

```txt
Website_HoTroDatVeXe-master/
  backend/
  frontend/
```

Backend dùng NodeJS + ExpressJS + Prisma + MySQL.  
Frontend dùng Next.js.

## 2. Chuẩn Bị Database

Mở WAMP và đảm bảo MySQL đang chạy.

Tạo database trong phpMyAdmin hoặc MySQL:

```sql
CREATE DATABASE website_dat_ve_xe CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Tạo file `.env` trong thư mục `backend/`:

```env
DATABASE_URL="mysql://root:@127.0.0.1:3306/website_dat_ve_xe"
JWT_SECRET="dat-ve-xe-secret-key"
FRONTEND_URL="http://localhost:3001"
PORT=3000
```

Nếu MySQL của máy có mật khẩu, sửa `DATABASE_URL` theo mật khẩu thật.

Ví dụ:

```env
DATABASE_URL="mysql://root:matkhau@127.0.0.1:3306/website_dat_ve_xe"
```

## 3. Cài Đặt Backend

Mở terminal tại thư mục project:

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run prisma:seed
npm run dev
```

Backend chạy tại:

```txt
http://localhost:3000
```

Seed sẽ tạo dữ liệu mẫu gồm tài khoản, nhà xe, xe, ghế, địa điểm, tuyến xe, chuyến xe và booking mẫu.

## 4. Cài Đặt Frontend

Mở terminal mới tại thư mục project:

```bash
cd frontend
npm install
npm run dev
```

Frontend chạy tại:

```txt
http://localhost:3001
```

Truy cập trình duyệt:

```txt
http://localhost:3001
```

## 5. Tài Khoản Test

Tài khoản admin:

```txt
Email: admin@datvexe.local
Mật khẩu: 123456
```

Tài khoản khách hàng mẫu:

```txt
Email: passenger.demo@datvexe.local
Mật khẩu: 123456
```

Tài khoản nhà xe phụ thuộc vào hồ sơ đối tác đã được duyệt trong database.

## 6. Các Trang Chính

Trang khách hàng:

```txt
/
/trips
/checkout
/tickets/lookup
/account
/account/tickets
/partners/apply
```

Trang admin:

```txt
/admin
/admin/bookings
/admin/users
/admin/locations
/admin/routes
/admin/trips
/admin/vehicles
/admin/bus-companies
/admin/partner-applications
```

Trang nhà xe:

```txt
/partner
/partner/vehicles
/partner/trips
/partner/bookings
```

## 7. Lệnh Thường Dùng

Backend:

```bash
cd backend
npm run dev
npm run build
npm run prisma:seed
npx prisma studio
```

Frontend:

```bash
cd frontend
npm run dev
npm run typecheck
```

## 8. Reset Database Khi Cần

Nếu muốn xóa dữ liệu cũ và tạo lại dữ liệu mẫu:

```bash
cd backend
npx prisma db push --force-reset
npm run prisma:seed
```

Lưu ý: lệnh trên sẽ xóa toàn bộ dữ liệu trong database hiện tại.

## 9. Lỗi Thường Gặp

### Không kết nối được database

Kiểm tra:

- WAMP đã bật chưa
- MySQL có đang chạy không
- Tên database có đúng là `website_dat_ve_xe` không
- `DATABASE_URL` trong `backend/.env` có đúng mật khẩu MySQL không

### Frontend gọi API lỗi

Kiểm tra backend đã chạy ở port `3000` chưa:

```txt
http://localhost:3000
```

Frontend proxy `/api/*` về backend, nên phải chạy backend trước.

### Port đã bị chiếm

Backend mặc định dùng `3000`, frontend dùng `3001`.

Nếu bị chiếm port, tắt tiến trình đang chạy hoặc đổi port trong `.env` và cấu hình frontend.

## 10. Thứ Tự Chạy Đúng

Mỗi lần mở project để test:

1. Bật WAMP.
2. Chạy backend:

```bash
cd backend
npm run dev
```

3. Chạy frontend:

```bash
cd frontend
npm run dev
```

4. Mở trình duyệt:

```txt
http://localhost:3001
```
