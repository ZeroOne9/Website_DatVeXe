import { Router } from "express";

import {
  approveAdminPartnerApplicationController,
  cancelAdminBookingController,
  createAdminBusCompanyController,
  createAdminLocationController,
  createAdminRouteController,
  createAdminTripController,
  createAdminVehicleController,
  createAdminVehicleSeatController,
  deleteAdminRouteController,
  deleteAdminTripController,
  deleteAdminUserController,
  deleteAdminVehicleController,
  getDashboardStatsController,
  listAdminBookingsController,
  listAdminBusCompaniesController,
  listAdminLocationsController,
  listAdminPartnerApplicationsController,
  listAdminRoutesController,
  listAdminTripsController,
  listAdminUsersController,
  listAdminVehiclesController,
  listAdminVehicleSeatsController,
  rejectAdminPartnerApplicationController,
  updateAdminRouteController,
  updateAdminTripController,
  updateAdminUserController,
  updateAdminVehicleController,
} from "@/modules/admin/admin.controller";
import {
  changePasswordController,
  getMeController,
  loginController,
  logoutController,
  registerController,
  updateMeController,
} from "@/modules/auth/auth.controller";
import {
  cancelBookingController,
  confirmBookingController,
  createBookingController,
  getBookingByCodeController,
  getMyBookingsController,
} from "@/modules/bookings/booking.controller";
import { listLocationsController } from "@/modules/locations/location.controller";
import {
  createPartnerTripController,
  createPartnerVehicleController,
  createPartnerVehicleSeatController,
  deletePartnerVehicleController,
  getPartnerDashboardController,
  listPartnerBookingsController,
  listPartnerRoutesController,
  listPartnerTripsController,
  listPartnerVehiclesController,
  updatePartnerVehicleController,
} from "@/modules/partner/partner.controller";
import { createPartnerApplicationController } from "@/modules/partners/partner.controller";
import { getTicketByCodeController } from "@/modules/tickets/ticket.controller";
import { getTripSeatsController, searchTripsController } from "@/modules/trips/trip.controller";
import { asyncRoute, success } from "@/http/response";

export function createApiRouter() {
  const router = Router();

  router.get("/health", (_request, response) => {
    success(response, { service: "backend", runtime: "node-express" }, { message: "Backend dang hoat dong." });
  });

  router.post("/auth/register", asyncRoute(registerController));
  router.post("/auth/login", asyncRoute(loginController));
  router.post("/auth/logout", logoutController);
  router.get("/auth/me", asyncRoute(getMeController));
  router.patch("/auth/me", asyncRoute(updateMeController));
  router.patch("/auth/password", asyncRoute(changePasswordController));

  router.get("/locations", asyncRoute(listLocationsController));
  router.get("/trips", asyncRoute(searchTripsController));
  router.get("/trips/:id/seats", asyncRoute(getTripSeatsController));

  router.post("/bookings", asyncRoute(createBookingController));
  router.get("/bookings/me", asyncRoute(getMyBookingsController));
  router.get("/bookings/:bookingCode", asyncRoute(getBookingByCodeController));
  router.post("/bookings/:bookingCode/confirm", asyncRoute(confirmBookingController));
  router.post("/bookings/:bookingCode/cancel", asyncRoute(cancelBookingController));

  router.get("/tickets/:code", asyncRoute(getTicketByCodeController));
  router.post("/partners/apply", asyncRoute(createPartnerApplicationController));

  router.get("/admin/dashboard", asyncRoute(getDashboardStatsController));
  router.get("/admin/locations", asyncRoute(listAdminLocationsController));
  router.post("/admin/locations", asyncRoute(createAdminLocationController));
  router.get("/admin/routes", asyncRoute(listAdminRoutesController));
  router.post("/admin/routes", asyncRoute(createAdminRouteController));
  router.patch("/admin/routes/:id", asyncRoute(updateAdminRouteController));
  router.delete("/admin/routes/:id", asyncRoute(deleteAdminRouteController));
  router.get("/admin/bus-companies", asyncRoute(listAdminBusCompaniesController));
  router.post("/admin/bus-companies", asyncRoute(createAdminBusCompanyController));
  router.get("/admin/partner-applications", asyncRoute(listAdminPartnerApplicationsController));
  router.patch("/admin/partner-applications/:id/approve", asyncRoute(approveAdminPartnerApplicationController));
  router.patch("/admin/partner-applications/:id/reject", asyncRoute(rejectAdminPartnerApplicationController));
  router.get("/admin/vehicles", asyncRoute(listAdminVehiclesController));
  router.post("/admin/vehicles", asyncRoute(createAdminVehicleController));
  router.patch("/admin/vehicles/:id", asyncRoute(updateAdminVehicleController));
  router.delete("/admin/vehicles/:id", asyncRoute(deleteAdminVehicleController));
  router.get("/admin/vehicles/:id/seats", asyncRoute(listAdminVehicleSeatsController));
  router.post("/admin/vehicles/:id/seats", asyncRoute(createAdminVehicleSeatController));
  router.get("/admin/trips", asyncRoute(listAdminTripsController));
  router.post("/admin/trips", asyncRoute(createAdminTripController));
  router.patch("/admin/trips/:id", asyncRoute(updateAdminTripController));
  router.delete("/admin/trips/:id", asyncRoute(deleteAdminTripController));
  router.get("/admin/bookings", asyncRoute(listAdminBookingsController));
  router.post("/admin/bookings/:bookingCode/cancel", asyncRoute(cancelAdminBookingController));
  router.get("/admin/users", asyncRoute(listAdminUsersController));
  router.patch("/admin/users/:id", asyncRoute(updateAdminUserController));
  router.delete("/admin/users/:id", asyncRoute(deleteAdminUserController));

  router.get("/partner/dashboard", asyncRoute(getPartnerDashboardController));
  router.get("/partner/routes", asyncRoute(listPartnerRoutesController));
  router.get("/partner/vehicles", asyncRoute(listPartnerVehiclesController));
  router.post("/partner/vehicles", asyncRoute(createPartnerVehicleController));
  router.patch("/partner/vehicles/:id", asyncRoute(updatePartnerVehicleController));
  router.delete("/partner/vehicles/:id", asyncRoute(deletePartnerVehicleController));
  router.post("/partner/vehicles/:id/seats", asyncRoute(createPartnerVehicleSeatController));
  router.get("/partner/trips", asyncRoute(listPartnerTripsController));
  router.post("/partner/trips", asyncRoute(createPartnerTripController));
  router.get("/partner/bookings", asyncRoute(listPartnerBookingsController));

  return router;
}
