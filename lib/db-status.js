// Database availability switch.
// Set DATABASE_OUTAGE to false to serve the shop and the admin normally again.
export const DATABASE_OUTAGE = true;

// Payload returned by the APIs while the switch is on.
export const DATABASE_OUTAGE_PAYLOAD = {
  error: "Egress quota exceeded",
  detail:
    "The database has reached its limit: this project has exceeded its egress quota. Data is temporarily unavailable until the quota resets.",
  code: "EGRESS_QUOTA_EXCEEDED",
};

export function databaseOutageResponse() {
  return Response.json(DATABASE_OUTAGE_PAYLOAD, { status: 503 });
}
