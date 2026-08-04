import { apiClient } from "@/services/apiClient";
import type { TripSearchItem, TripSeatsResult } from "@/services/types";

export type TripSearchParams = {
  departureLocationId: string | number;
  destinationLocationId: string | number;
  departureLocationLabel?: string;
  destinationLocationLabel?: string;
  date?: string;
};

export const tripService = {
  searchTrips(params: TripSearchParams) {
    return apiClient.get<{ trips: TripSearchItem[] }>("/api/trips", params);
  },

  getSeats(tripId: string | number) {
    return apiClient.get<TripSeatsResult>(`/api/trips/${tripId}/seats`);
  },
};
