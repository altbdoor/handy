import { type FeedMessage, type VehiclePosition } from "gtfs-types";

type Vehicle = NonNullable<VehiclePosition["vehicle"]>;
interface CustomVehicle extends Vehicle {
  licensePlate?: Vehicle["license_plate"];
}

type Trip = NonNullable<VehiclePosition["trip"]>;
interface CustomTrip extends Trip {
  routeId?: Trip["route_id"];
}

/** prasarana seems to prefer camelCase over snake_case */
interface CustomVehiclePosition extends VehiclePosition {
  trip?: CustomTrip;
  vehicle?: CustomVehicle;
}

export type BusLocation = {
  routeId: string;
  plate: string;
  speed: number;
  bearing: number;
  latitude: number;
  longitude: number;
};

export async function getBusLocation(Gtfs: any): Promise<BusLocation[]> {
  // https://developer.data.gov.my/realtime-api/gtfs-realtime#prasarana
  const protoRes = await fetch(
    "https://api.data.gov.my/gtfs-realtime/vehicle-position/prasarana/?category=rapid-bus-mrtfeeder",
  );

  if (!protoRes.ok) {
    console.error(protoRes.status, protoRes.body);
    return [];
  }

  const protoData = await protoRes.arrayBuffer();
  const { entity }: FeedMessage = Gtfs.transit_realtime.FeedMessage.decode(
    new Uint8Array(protoData),
  );

  const routeIds = ["T114", "T152"];
  const busRoutes = (entity ?? []).filter((ent) => {
    const id = (ent.vehicle as CustomVehiclePosition).trip?.routeId;
    return routeIds.includes(id ?? "");
  });

  return busRoutes.flatMap((datum) => {
    const { trip, vehicle, position } = datum.vehicle as CustomVehiclePosition;

    const routeId = trip?.routeId;
    const plate = vehicle?.licensePlate;
    const speed = position?.speed ?? 0;
    const bearing = position?.bearing ?? 0;
    const latitude = position?.latitude;
    const longitude = position?.longitude;

    if (!routeId || !plate) {
      return [];
    }

    if (latitude == null || longitude == null) {
      return [];
    }

    return [{ routeId, plate, speed, bearing, latitude, longitude }];
  });
}

export function getBusSvg(): string {
  // https://icons.getbootstrap.com/icons/arrow-up-circle/
  return `
    <div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="currentColor"
        viewBox="0 0 16 16"
      >
        <path
          fill-rule="evenodd"
          d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8m15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-7.5 3.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707z"
        />
      </svg>
    </div>
  `.trim();
}
