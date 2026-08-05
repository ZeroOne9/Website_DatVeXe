# Website Ho Tro Dat Ve Xe

Du an duoc tach thanh 2 ung dung rieng:

```txt
Website_HoTroDatVeXe-master/
  backend/
  frontend/
```

## Backend

Backend nam trong `backend/`, dung NodeJS + ExpressJS, Prisma MySQL, JWT, bcrypt va Zod.

Truoc khi chay backend, can bat MySQL/WAMP va tao database:

```sql
CREATE DATABASE website_dat_ve_xe CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Tao file `backend/.env`:

```env
DATABASE_URL="mysql://root:@127.0.0.1:3306/website_dat_ve_xe"
JWT_SECRET="dat-ve-xe-local-dev-secret"
FRONTEND_URL="http://localhost:3001"
PORT=3000
```

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run prisma:seed
npm run dev
```

Backend chay tai:

```txt
http://localhost:3000
```

Frontend proxy `/api/*` ve backend port 3000, nen hay chay backend truoc khi test frontend.

## Frontend

Frontend nam trong `frontend/`, dung Next.js App Router va goi backend qua proxy `/api`.

```bash
cd frontend
npm install
npm run dev
```

Frontend chay tai:

```txt
http://localhost:3001
```

## Tai Khoan Test Sau Khi Chay Seed

Sau khi chay:

```bash
cd backend
npm run prisma:seed
```

Seed se tao san cac tai khoan test:

```txt
Admin:
Email: admin@datvexe.local
Password: 123456

Khach hang demo:
Email: passenger.demo@datvexe.local
Password: 123456
```

## Flow Test Co Ban

1. Bat MySQL/WAMP.
2. Chay backend:

```bash
cd backend
npm run dev
```

3. Chay frontend:

```bash
cd frontend
npm run dev
```

4. Mo trinh duyet tai:

```txt
http://localhost:3001
```

5. Test luong khach hang:
- Dang nhap bang `passenger.demo@datvexe.local / 123456`.
- Vao trang chu hoac `/trips`.
- Tim chuyen xe, chon chuyen, chon ghe va dat ve.
- Vao `/account/tickets` de xem ve cua tai khoan.
- Vao `/tickets/lookup` va tra cuu bang ma booking.

6. Test luong admin:
- Dang nhap bang `admin@datvexe.local / 123456`.
- Sau khi dang nhap, he thong chuyen ve `/admin`.
- Kiem tra dashboard.
- Kiem tra cac man quan ly: booking, khach hang, dia diem, tuyen xe, chuyen xe, nha xe, xe va ghe.
- Co the dung cac booking demo de test tra cuu/huy/xac nhan:

```txt
BKDEMOFUTURECONFIRMED
BKDEMOFUTUREPENDING
BKDEMOFUTURECANCELLED
```

## Ghi chu

- `backend/src/server.ts`: Express server va router layer.
- `backend/src/modules/**/*.service.ts`: service layer.
- `backend/src/modules/**/*.validator.ts`: validation layer voi Zod.
- `backend/prisma/schema.prisma`: model/database schema.
- `frontend/src/services`: API client va services cho UI.
