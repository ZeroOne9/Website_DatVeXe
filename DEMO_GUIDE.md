# Huong dan demo bao cao tien do

Thoi luong goi y: 3-5 phut.

## 1. Tai khoan test

Admin:

```text
Email: admin@datvexe.local
Password: 123456
```

Passenger demo:

```text
Email: passenger.demo@datvexe.local
Password: 123456
```

## 2. Du lieu demo nen dung

Ngay demo:

```text
13/07/2026
```

Tuyen demo:

```text
Ben xe Mien Dong -> Ben xe Da Lat
```

Ngay ve demo cho ve khu hoi:

```text
14/07/2026
```

Backend:

```text
http://localhost:3000
```

Frontend:

```text
http://localhost:3001
```

Admin:

```text
http://localhost:3001/admin
```

## 3. Kich ban demo Admin full chain

Muc tieu: cho thay admin co the tu tao du lieu nghiep vu theo chuoi:

```text
Nha xe -> Xe & Ghe -> Tuyen xe -> Chuyen xe -> Booking
```

### Buoc 1: Dang nhap admin

Mo:

```text
http://localhost:3001/login
```

Dang nhap:

```text
admin@datvexe.local
123456
```

Sau do vao:

```text
http://localhost:3001/admin
```

Noi:

```text
Dashboard tong hop doanh thu, booking, nha xe, xe va chuyen xe. Day la man hinh tong quan cho nguoi quan tri.
```

### Buoc 2: Tao nha xe

Mo:

```text
http://localhost:3001/admin/bus-companies
```

Bam:

```text
+ Them nha xe
```

Nhap mau:

```text
Ten nha xe: Nha xe Demo Express
So dien thoai: 19001234
Email: demoexpress@example.com
Dia chi: 123 Le Loi, Quan 1, TP.HCM
```

Noi:

```text
Nha xe la don vi so huu va van hanh xe. Sau khi tao nha xe, du lieu nay se xuat hien trong dropdown khi tao xe moi.
```

### Buoc 3: Tao xe moi

Mo:

```text
http://localhost:3001/admin/vehicles
```

Bam:

```text
+ Them xe moi
```

Nhap mau:

```text
Nha xe quan ly: Nha xe Demo Express
Ten xe: Demo Express 34G
Bien so xe: 51B-DEMO1
Loai xe: Giuong nam 34 cho
Suc chua: 34
```

Noi:

```text
Xe thuoc ve mot nha xe. Moi xe co suc chua rieng va se duoc cau hinh danh sach ghe.
```

### Buoc 4: Tao ghe cho xe

Trong danh sach xe, bam:

```text
Quan ly Ghe
```

Nhap nhanh mot vai ghe mau:

```text
A01 - Tang 1 - sleeper
A02 - Tang 1 - sleeper
A03 - Tang 1 - sleeper
B01 - Tang 2 - sleeper
B02 - Tang 2 - sleeper
```

Noi:

```text
He thong khong cho tao vuot qua suc chua cua xe. Cac ghe nay se duoc dung khi hanh khach chon ghe trong luc dat ve.
```

### Buoc 5: Tao tuyen xe

Mo:

```text
http://localhost:3001/admin/routes
```

Bam:

```text
+ Tao tuyen moi
```

Nhap mau:

```text
Diem xuat phat: Ben xe Mien Dong
Diem den: Ben xe Da Lat
Quang duong: 305.5
Thoi gian du kien: 420
```

Neu tuyen nay da ton tai, co the chon cap diem khac:

```text
Ben xe Mien Dong -> Ben xe Trung tam Can Tho
```

Noi:

```text
Tuyen xe dinh nghia diem di, diem den, khoang cach va thoi gian du kien. Chuyen xe se duoc tao dua tren tuyen nay.
```

### Buoc 6: Tao chuyen xe

Mo:

```text
http://localhost:3001/admin/trips
```

Bam:

```text
+ Tao chuyen moi
```

Nhap mau:

```text
Tuyen duong: Ben xe Mien Dong -> Ben xe Da Lat
Xe: Demo Express 34G
Thoi gian xuat phat: chon ngay cach hien tai 7-14 ngay
Thoi gian den du kien: sau gio xuat phat
Gia ve: 320000
```

Noi:

```text
Chuyen xe la lich chay cu the, gan mot tuyen voi mot xe va thoi gian khoi hanh. Sau khi tao chuyen, hanh khach co the tim thay chuyen nay o trang dat ve.
```

### Buoc 7: Xem booking

Mo:

```text
http://localhost:3001/admin/bookings
```

Noi:

```text
Admin co the theo doi tat ca booking, trang thai thanh toan, ghe da dat va tong tien.
```

## 4. Kich ban demo Passenger flow 3-5 phut

### Buoc 1: Dang nhap admin

Mo:

```text
http://localhost:3001/login
```

Dang nhap bang tai khoan admin:

```text
admin@datvexe.local
123456
```

Noi:

```text
Day la khu vuc quan tri danh cho admin. Admin co the xem du lieu dat ve, quan ly chuyen xe va theo doi trang thai booking.
```

### Buoc 2: Xem quan ly chuyen xe

Mo:

```text
http://localhost:3001/admin/trips
```

Noi:

```text
Man hinh nay hien thi danh sach chuyen xe, bao gom tuyen duong, xe, gio khoi hanh, gia ve, so ve da ban va trang thai chuyen.
```

Chi vao chuyen ngay `13/07/2026`, tuyen:

```text
Ben xe Mien Dong -> Ben xe Da Lat
```

### Buoc 3: Xem quan ly booking

Mo:

```text
http://localhost:3001/admin/bookings
```

Noi:

```text
Admin co the xem danh sach booking theo trang thai nhu cho thanh toan, da thanh toan, da huy. He thong da co mot so booking mau de kiem thu.
```

### Buoc 4: Chuyen sang flow hanh khach

Co the logout admin hoac mo tab an danh moi.

Mo:

```text
http://localhost:3001
```

Tim chuyen:

```text
Diem di: Ben xe Mien Dong
Diem den: Ben xe Da Lat
Ngay di: 13/07/2026
```

Noi:

```text
Hanh khach nhap diem di, diem den va ngay khoi hanh. He thong goi API tim chuyen phu hop tu backend.
```

### Buoc 5: Chon chuyen va chon nhieu ghe

O danh sach chuyen, chon mot chuyen con ghe.

Chon nhieu ghe, vi du:

```text
A06, A07
```

Noi:

```text
He thong ho tro chon nhieu ghe trong mot lan dat. Cac ghe da dat hoac khong kha dung se bi khoa.
```

### Buoc 6: Checkout va tao booking

Nhap thong tin hanh khach:

```text
Ho ten: Nguyen Van Bao Cao
So dien thoai: 0901234567
Email: demo.baocao@example.com
```

Noi:

```text
O buoc nay hanh khach xac nhan thong tin lien he. Backend se tao mot booking gom nhieu booking seat.
```

Bam thanh toan/tao booking.

### Buoc 7: Xac nhan thanh toan va phat hanh ve

Sau khi sang trang tra cuu booking, noi:

```text
Booking vua tao dang o trang thai cho thanh toan. Vi he thong dang mo phong thanh toan, nut xac nhan thanh toan se goi API confirm booking.
```

Bam xac nhan thanh toan.

Noi:

```text
Sau khi thanh toan thanh cong, booking chuyen sang trang thai da thanh toan va he thong phat hanh ma ve rieng cho tung ghe.
```

### Buoc 8: Quay lai admin kiem tra booking moi

Mo:

```text
http://localhost:3001/admin/bookings
```

Bam lam moi neu can.

Noi:

```text
Booking moi da xuat hien trong danh sach quan tri. Admin co the kiem tra thong tin khach hang, tuyen xe, so ghe, tong tien va trang thai thanh toan.
```

## 5. Kich ban demo ve khu hoi

Muc tieu: cho thay mot booking co the gom ca chieu di va chieu ve.

Mo frontend:

```text
http://localhost:3001
```

Tim chuyen:

```text
Diem di: Ben xe Mien Dong
Diem den: Ben xe Da Lat
Ngay di: 13/07/2026
Ngay ve: 14/07/2026
```

Thao tac:

```text
1. Bam Tim chuyen.
2. O danh sach chieu di, chon chuyen va chon 1-2 ghe.
3. He thong tu chuyen sang danh sach chieu ve Da Lat -> Ben xe Mien Dong.
4. Chon chuyen ve va chon ghe.
5. Sang checkout, kiem tra tom tat co ca Chieu di va Chieu ve.
6. Bam Thanh toan de tao booking khu hoi.
```

Noi khi demo:

```text
Voi ve khu hoi, backend luu mot Booking duy nhat, nhung cac ghe duoc tach theo legType: outbound cho chieu di va return cho chieu ve. Cach nay giup tra cuu, huy ve va thong ke van di theo mot ma booking chung.
```

Du lieu mau da co san:

```text
Chieu di: Ben xe Mien Dong -> Ben xe Da Lat, 13/07/2026
Chieu ve: Ben xe Da Lat -> Ben xe Mien Dong, 14/07/2026
```

## 6. Cau chot demo

```text
Nhu vay he thong da hoan thanh cac nghiep vu loi: admin quan ly nha xe, xe va ghe, tuyen xe, chuyen xe, booking; hanh khach tim chuyen, chon nhieu ghe, dat ve mot chieu hoac khu hoi, thanh toan mo phong va nhan ma ve.
```

## 7. Neu can seed lai du lieu

Chay WAMP/MySQL truoc, sau do chay:

```bash
cd backend
npm run prisma:seed
```
