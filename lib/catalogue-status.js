// Catalogue availability switch.
// Set CATALOGUE_OUTAGE to false to serve products normally again.
export const CATALOGUE_OUTAGE = true;

// Payload returned by the public APIs while the switch is on.
export const CATALOGUE_OUTAGE_PAYLOAD = {
  error: "Egress quota exceeded",
  detail:
    "The database has reached its limit: this project has exceeded its egress quota. The catalogue is temporarily unavailable until the quota resets.",
  code: "EGRESS_QUOTA_EXCEEDED",
};
