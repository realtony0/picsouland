// Database availability switch.
// Set DATABASE_OUTAGE to true to take the shop and the admin offline.
export const DATABASE_OUTAGE = false;

// PostgREST-shaped error body, as returned when the project is over quota.
export const DATABASE_OUTAGE_PAYLOAD = {
  code: "XX000",
  details: null,
  hint: null,
  message: "Egress quota exceeded",
};

export function databaseOutageResponse() {
  return Response.json(DATABASE_OUTAGE_PAYLOAD, { status: 503 });
}
