import Gtfs from "gtfs-realtime-bindings";

export type BusLocation = {
  routeId: string;
  plate: string;
  speed: number;
  bearing: number;
  latitude: number;
  longitude: number;
};

export async function getBusLocation(): Promise<BusLocation[]> {
  const protoRes = await fetch(
    "https://api.data.gov.my/gtfs-realtime/vehicle-position/prasarana?category=rapid-bus-mrtfeeder",
  );

  if (!protoRes.ok) {
    console.error(protoRes.status, protoRes.body);
    return [];
  }

  const protoData = await protoRes.arrayBuffer();
  const protoFeed = Gtfs.transit_realtime.FeedMessage.decode(
    new Uint8Array(protoData),
  );

  const routeIds = ["T114", "T152"];
  const busRoutes = protoFeed.entity.filter((ent) =>
    routeIds.includes(ent.vehicle?.trip?.routeId ?? ""),
  );

  return busRoutes.flatMap((datum) => {
    const routeId = datum.vehicle?.trip?.routeId;
    const plate = datum.vehicle?.vehicle?.licensePlate;
    const speed = datum.vehicle?.position?.speed ?? 0;
    const bearing = datum.vehicle?.position?.bearing ?? 0;
    const latitude = datum.vehicle?.position?.latitude;
    const longitude = datum.vehicle?.position?.longitude;

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
