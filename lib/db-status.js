// Database availability switch.
// Set DATABASE_OUTAGE to false to serve the shop and the admin normally again.
export const DATABASE_OUTAGE = true;

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
