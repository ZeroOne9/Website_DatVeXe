const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function atTime(date, hours, minutes = 0) {
  const next = new Date(date);
  next.setHours(hours, minutes, 0, 0);
  return next;
}

async function upsertLocation(data) {
  return prisma.location.upsert({
    where: {
      name_province: {
        name: data.name,
        province: data.province,
      },
    },
    update: data,
    create: data,
  });
}

async function upsertRoute(departureLocationId, destinationLocationId, data) {
  return prisma.route.upsert({
    where: {
      departureLocationId_destinationLocationId: {
        departureLocationId,
        destinationLocationId,
      },
    },
    update: data,
    create: {
      departureLocationId,
      destinationLocationId,
      ...data,
    },
  });
}

async function ensureSeats(vehicleId, seatType = "sleeper") {
  const seatCodes = [
    ...Array.from({ length: 17 }, (_, index) => `A${String(index + 1).padStart(2, "0")}`),
    ...Array.from({ length: 17 }, (_, index) => `B${String(index + 1).padStart(2, "0")}`),
  ];

  for (const [index, seatCode] of seatCodes.entries()) {
    await prisma.seat.upsert({
      where: {
        vehicleId_seatCode: {
          vehicleId,
          seatCode,
        },
      },
      update: {
        seatType,
        floor: seatCode.startsWith("A") ? 1 : 2,
        rowNumber: (index % 17) + 1,
        colNumber: index % 2 === 0 ? 1 : 2,
        isActive: true,
      },
      create: {
        vehicleId,
        seatCode,
        seatType,
        floor: seatCode.startsWith("A") ? 1 : 2,
        rowNumber: (index % 17) + 1,
        colNumber: index % 2 === 0 ? 1 : 2,
      },
    });
  }
}

async function createTrip(routeId, vehicleId, departureDate, estimatedMinutes, priceVnd) {
  const arrivalTime = new Date(departureDate.getTime() + estimatedMinutes * 60 * 1000);

  const existingTrip = await prisma.trip.findFirst({
    where: {
      routeId,
      vehicleId,
      departureTime: departureDate,
    },
  });

  if (existingTrip) {
    return prisma.trip.update({
      where: { id: existingTrip.id },
      data: {
        arrivalTime,
        priceVnd,
        status: "scheduled",
      },
    });
  }

  return prisma.trip.create({
    data: {
      routeId,
      vehicleId,
      departureTime: departureDate,
      arrivalTime,
      priceVnd,
    },
  });
}

async function createDemoBooking({ bookingCode, userId, trip, passengerName, passengerPhone, passengerEmail, seatCodes, status }) {
  const existingBooking = await prisma.booking.findUnique({
    where: { bookingCode },
    select: { id: true },
  });

  if (existingBooking) {
    return existingBooking;
  }

  const seats = await prisma.seat.findMany({
    where: {
      vehicleId: trip.vehicleId,
      seatCode: {
        in: seatCodes,
      },
      isActive: true,
    },
    orderBy: {
      seatCode: "asc",
    },
    select: {
      id: true,
      seatCode: true,
    },
  });

  if (seats.length !== seatCodes.length) {
    throw new Error(`Khong tim thay du ghe demo cho booking ${bookingCode}.`);
  }

  const booking = await prisma.booking.create({
    data: {
      bookingCode,
      userId,
      passengerName,
      passengerPhone,
      passengerEmail,
      totalFareVnd: trip.priceVnd * seats.length,
      status,
      expiresAt: status === "pending" ? addDays(new Date(), 1) : null,
      confirmedAt: status === "confirmed" ? new Date() : null,
      cancelledAt: status === "cancelled" ? new Date() : null,
      bookingSeats: {
        create: seats.map((seat) => ({
          tripId: trip.id,
          seatId: seat.id,
          fareVnd: trip.priceVnd,
        })),
      },
    },
    include: {
      bookingSeats: {
        include: {
          seat: true,
        },
      },
    },
  });

  if (status === "confirmed") {
    for (const bookingSeat of booking.bookingSeats) {
      await prisma.ticket.create({
        data: {
          bookingSeatId: bookingSeat.id,
          code: `TKDEMO${booking.id}${bookingSeat.seat.seatCode}`,
          qrCode: `${bookingCode}:${bookingSeat.id}`,
        },
      });
    }
  }

  return booking;
}

async function main() {
  const passwordHash = await bcrypt.hash("123456", 10);

  await prisma.user.upsert({
    where: { email: "admin@datvexe.local" },
    update: {
      fullName: "Quan tri vien",
      phone: "0900000001",
      passwordHash,
      role: "admin",
      status: "active",
    },
    create: {
      fullName: "Quan tri vien",
      email: "admin@datvexe.local",
      phone: "0900000001",
      passwordHash,
      role: "admin",
    },
  });

  const demoPassenger = await prisma.user.upsert({
    where: { email: "passenger.demo@datvexe.local" },
    update: {
      fullName: "Nguyen Van Demo",
      phone: "0900000002",
      passwordHash,
      role: "passenger",
      status: "active",
    },
    create: {
      fullName: "Nguyen Van Demo",
      email: "passenger.demo@datvexe.local",
      phone: "0900000002",
      passwordHash,
      role: "passenger",
    },
  });

  const locations = {
    hcm: await upsertLocation({
      name: "Ben xe Mien Dong",
      province: "TP. Ho Chi Minh",
      address: "292 Dinh Bo Linh, Binh Thanh",
    }),
    daLat: await upsertLocation({
      name: "Ben xe Da Lat",
      province: "Lam Dong",
      address: "01 To Hien Thanh, Da Lat",
    }),
    nhaTrang: await upsertLocation({
      name: "Ben xe Phia Nam Nha Trang",
      province: "Khanh Hoa",
      address: "Km so 6, duong 23/10, Nha Trang",
    }),
    canTho: await upsertLocation({
      name: "Ben xe Trung tam Can Tho",
      province: "Can Tho",
      address: "91B Nguyen Van Linh, Ninh Kieu",
    }),
    vungTau: await upsertLocation({
      name: "Ben xe Vung Tau",
      province: "Ba Ria - Vung Tau",
      address: "192 Nam Ky Khoi Nghia, Vung Tau",
    }),
    phanThiet: await upsertLocation({
      name: "Ben xe Phan Thiet",
      province: "Binh Thuan",
      address: "Tu Van Tu, Phan Thiet",
    }),
    daNang: await upsertLocation({
      name: "Ben xe Trung tam Da Nang",
      province: "Da Nang",
      address: "Ton Duc Thang, Lien Chieu",
    }),
    hue: await upsertLocation({
      name: "Ben xe Phia Nam Hue",
      province: "Thua Thien Hue",
      address: "97 An Duong Vuong, Hue",
    }),
    haNoi: await upsertLocation({
      name: "Ben xe My Dinh",
      province: "Ha Noi",
      address: "20 Pham Hung, Nam Tu Liem",
    }),
  };

  const phuongTrang = await prisma.busCompany.upsert({
    where: { name: "Phuong Trang" },
    update: {
      phone: "19006067",
      email: "support@phuongtrang.example",
      address: "TP. Ho Chi Minh",
      description: "Nha xe duong dai phuc vu nhieu tuyen mien Nam.",
    },
    create: {
      name: "Phuong Trang",
      phone: "19006067",
      email: "support@phuongtrang.example",
      address: "TP. Ho Chi Minh",
      description: "Nha xe duong dai phuc vu nhieu tuyen mien Nam.",
    },
  });

  const thanhBuoi = await prisma.busCompany.upsert({
    where: { name: "Thanh Buoi" },
    update: {
      phone: "19006079",
      email: "support@thanhbuoi.example",
      address: "TP. Ho Chi Minh",
      description: "Nha xe chuyen tuyen TP. Ho Chi Minh di Da Lat.",
    },
    create: {
      name: "Thanh Buoi",
      phone: "19006079",
      email: "support@thanhbuoi.example",
      address: "TP. Ho Chi Minh",
      description: "Nha xe chuyen tuyen TP. Ho Chi Minh di Da Lat.",
    },
  });

  const kumhoSamco = await prisma.busCompany.upsert({
    where: { name: "Kumho Samco" },
    update: {
      phone: "19006065",
      email: "support@kumhosamco.example",
      address: "TP. Ho Chi Minh",
      description: "Nha xe khai thac cac tuyen mien Dong va mien Trung.",
    },
    create: {
      name: "Kumho Samco",
      phone: "19006065",
      email: "support@kumhosamco.example",
      address: "TP. Ho Chi Minh",
      description: "Nha xe khai thac cac tuyen mien Dong va mien Trung.",
    },
  });

  const hanhCafe = await prisma.busCompany.upsert({
    where: { name: "Hanh Cafe" },
    update: {
      phone: "19006068",
      email: "support@hanhcafe.example",
      address: "TP. Ho Chi Minh",
      description: "Nha xe du lich phuc vu cac tuyen bien va mien Trung.",
    },
    create: {
      name: "Hanh Cafe",
      phone: "19006068",
      email: "support@hanhcafe.example",
      address: "TP. Ho Chi Minh",
      description: "Nha xe du lich phuc vu cac tuyen bien va mien Trung.",
    },
  });

  const vehicles = {
    ft01: await prisma.vehicle.upsert({
      where: { licensePlate: "51B-12345" },
      update: {
        busCompanyId: phuongTrang.id,
        name: "PT Limousine 34G",
        vehicleType: "Giuong nam",
        capacity: 34,
        status: "active",
      },
      create: {
        busCompanyId: phuongTrang.id,
        licensePlate: "51B-12345",
        name: "PT Limousine 34G",
        vehicleType: "Giuong nam",
        capacity: 34,
      },
    }),
    tb01: await prisma.vehicle.upsert({
      where: { licensePlate: "51B-67890" },
      update: {
        busCompanyId: thanhBuoi.id,
        name: "TB Cabin 34P",
        vehicleType: "Phong nam",
        capacity: 34,
        status: "active",
      },
      create: {
        busCompanyId: thanhBuoi.id,
        licensePlate: "51B-67890",
        name: "TB Cabin 34P",
        vehicleType: "Phong nam",
        capacity: 34,
      },
    }),
    ks01: await prisma.vehicle.upsert({
      where: { licensePlate: "51B-24680" },
      update: {
        busCompanyId: kumhoSamco.id,
        name: "KS Express 40G",
        vehicleType: "Giuong nam 40",
        capacity: 40,
        status: "active",
      },
      create: {
        busCompanyId: kumhoSamco.id,
        licensePlate: "51B-24680",
        name: "KS Express 40G",
        vehicleType: "Giuong nam 40",
        capacity: 40,
      },
    }),
    hc01: await prisma.vehicle.upsert({
      where: { licensePlate: "51B-13579" },
      update: {
        busCompanyId: hanhCafe.id,
        name: "HC Limousine 28",
        vehicleType: "Limousine VIP",
        capacity: 34,
        status: "active",
      },
      create: {
        busCompanyId: hanhCafe.id,
        licensePlate: "51B-13579",
        name: "HC Limousine 28",
        vehicleType: "Limousine VIP",
        capacity: 34,
      },
    }),
  };

  await ensureSeats(vehicles.ft01.id, "sleeper");
  await ensureSeats(vehicles.tb01.id, "vip");
  await ensureSeats(vehicles.ks01.id, "sleeper");
  await ensureSeats(vehicles.hc01.id, "vip");

  const routes = {
    hcmDaLat: await upsertRoute(locations.hcm.id, locations.daLat.id, {
      distanceKm: 305.5,
      estimatedMinutes: 420,
      status: "active",
    }),
    daLatHcm: await upsertRoute(locations.daLat.id, locations.hcm.id, {
      distanceKm: 305.5,
      estimatedMinutes: 420,
      status: "active",
    }),
    hcmNhaTrang: await upsertRoute(locations.hcm.id, locations.nhaTrang.id, {
      distanceKm: 430,
      estimatedMinutes: 540,
      status: "active",
    }),
    hcmCanTho: await upsertRoute(locations.hcm.id, locations.canTho.id, {
      distanceKm: 170,
      estimatedMinutes: 210,
      status: "active",
    }),
    canThoHcm: await upsertRoute(locations.canTho.id, locations.hcm.id, {
      distanceKm: 170,
      estimatedMinutes: 210,
      status: "active",
    }),
    hcmVungTau: await upsertRoute(locations.hcm.id, locations.vungTau.id, {
      distanceKm: 95,
      estimatedMinutes: 150,
      status: "active",
    }),
    vungTauHcm: await upsertRoute(locations.vungTau.id, locations.hcm.id, {
      distanceKm: 95,
      estimatedMinutes: 150,
      status: "active",
    }),
    hcmPhanThiet: await upsertRoute(locations.hcm.id, locations.phanThiet.id, {
      distanceKm: 210,
      estimatedMinutes: 300,
      status: "active",
    }),
    phanThietHcm: await upsertRoute(locations.phanThiet.id, locations.hcm.id, {
      distanceKm: 210,
      estimatedMinutes: 300,
      status: "active",
    }),
    daNangHue: await upsertRoute(locations.daNang.id, locations.hue.id, {
      distanceKm: 105,
      estimatedMinutes: 150,
      status: "active",
    }),
    hueDaNang: await upsertRoute(locations.hue.id, locations.daNang.id, {
      distanceKm: 105,
      estimatedMinutes: 150,
      status: "active",
    }),
    haNoiDaNang: await upsertRoute(locations.haNoi.id, locations.daNang.id, {
      distanceKm: 770,
      estimatedMinutes: 960,
      status: "active",
    }),
    daNangHaNoi: await upsertRoute(locations.daNang.id, locations.haNoi.id, {
      distanceKm: 770,
      estimatedMinutes: 960,
      status: "active",
    }),
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const seedEndDate = new Date(today.getFullYear(), 8, 30);
  seedEndDate.setHours(23, 59, 59, 999);

  function schedule(route, vehicle, hour, minute, priceVnd) {
    return { route, vehicle, hour, minute, priceVnd };
  }

  const dailySchedules = [
    schedule(routes.hcmDaLat, vehicles.ft01, 7, 30, 320000),
    schedule(routes.hcmDaLat, vehicles.ks01, 11, 30, 340000),
    schedule(routes.hcmDaLat, vehicles.hc01, 18, 30, 360000),
    schedule(routes.hcmDaLat, vehicles.tb01, 22, 0, 380000),
    schedule(routes.daLatHcm, vehicles.ft01, 8, 0, 330000),
    schedule(routes.daLatHcm, vehicles.tb01, 13, 30, 360000),
    schedule(routes.daLatHcm, vehicles.ks01, 23, 0, 340000),
    schedule(routes.hcmNhaTrang, vehicles.ks01, 6, 0, 400000),
    schedule(routes.hcmNhaTrang, vehicles.ft01, 20, 30, 420000),
    schedule(routes.hcmNhaTrang, vehicles.hc01, 21, 30, 430000),
    schedule(routes.hcmCanTho, vehicles.tb01, 9, 0, 180000),
    schedule(routes.hcmCanTho, vehicles.hc01, 12, 30, 190000),
    schedule(routes.hcmCanTho, vehicles.ft01, 17, 30, 180000),
    schedule(routes.canThoHcm, vehicles.hc01, 5, 30, 180000),
    schedule(routes.canThoHcm, vehicles.tb01, 15, 0, 185000),
    schedule(routes.hcmVungTau, vehicles.hc01, 6, 30, 120000),
    schedule(routes.hcmVungTau, vehicles.tb01, 10, 0, 120000),
    schedule(routes.hcmVungTau, vehicles.ft01, 14, 30, 130000),
    schedule(routes.hcmVungTau, vehicles.ks01, 19, 0, 130000),
    schedule(routes.vungTauHcm, vehicles.hc01, 7, 0, 120000),
    schedule(routes.vungTauHcm, vehicles.tb01, 16, 30, 120000),
    schedule(routes.hcmPhanThiet, vehicles.hc01, 7, 15, 220000),
    schedule(routes.hcmPhanThiet, vehicles.ks01, 13, 45, 230000),
    schedule(routes.phanThietHcm, vehicles.hc01, 9, 30, 220000),
    schedule(routes.daNangHue, vehicles.hc01, 8, 0, 150000),
    schedule(routes.daNangHue, vehicles.ks01, 18, 0, 150000),
    schedule(routes.hueDaNang, vehicles.hc01, 9, 0, 150000),
    schedule(routes.hueDaNang, vehicles.ks01, 17, 30, 150000),
    schedule(routes.haNoiDaNang, vehicles.ks01, 19, 30, 620000),
    schedule(routes.haNoiDaNang, vehicles.ft01, 20, 15, 640000),
    schedule(routes.daNangHaNoi, vehicles.ks01, 18, 45, 620000),
  ];

  const tripPlans = [];

  for (let cursor = new Date(today), dayOffset = 0; cursor <= seedEndDate; cursor = addDays(cursor, 1), dayOffset += 1) {
    for (const dailySchedule of dailySchedules) {
      tripPlans.push({ ...dailySchedule, dayOffset });
    }
  }

  const createdTrips = [];

  for (const { route, vehicle, dayOffset, hour, minute, priceVnd } of tripPlans) {
    const trip = await createTrip(
      route.id,
      vehicle.id,
      atTime(addDays(today, dayOffset), hour, minute),
      route.estimatedMinutes,
      priceVnd,
    );

    createdTrips.push({ route, vehicle, dayOffset, trip });
  }

  const futureDemoTrips = createdTrips.filter((item) => item.dayOffset >= 7);

  await createDemoBooking({
    bookingCode: "BKDEMOFUTURECONFIRMED",
    userId: demoPassenger.id,
    trip: futureDemoTrips[0].trip,
    passengerName: "Nguyen Van Demo",
    passengerPhone: "0900000002",
    passengerEmail: "passenger.demo@datvexe.local",
    seatCodes: ["A01", "A02"],
    status: "confirmed",
  });

  await createDemoBooking({
    bookingCode: "BKDEMOFUTUREPENDING",
    userId: demoPassenger.id,
    trip: futureDemoTrips[1].trip,
    passengerName: "Tran Thi Mau",
    passengerPhone: "0900000003",
    passengerEmail: "tranthimau@example.com",
    seatCodes: ["A03", "A04", "A05"],
    status: "pending",
  });

  await createDemoBooking({
    bookingCode: "BKDEMOFUTURECANCELLED",
    userId: demoPassenger.id,
    trip: futureDemoTrips[3].trip,
    passengerName: "Le Van Test",
    passengerPhone: "0900000004",
    passengerEmail: "levantest@example.com",
    seatCodes: ["B01"],
    status: "cancelled",
  });

  const summary = {
    users: await prisma.user.count(),
    busCompanies: await prisma.busCompany.count(),
    vehicles: await prisma.vehicle.count(),
    seats: await prisma.seat.count(),
    locations: await prisma.location.count(),
    routes: await prisma.route.count(),
    trips: await prisma.trip.count(),
  };

  console.log("Seed completed:", summary);
  console.log("Admin account: admin@datvexe.local / 123456");
  console.log("Passenger demo account: passenger.demo@datvexe.local / 123456");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
