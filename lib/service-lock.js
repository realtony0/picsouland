// Verrou de service : toutes les operations d'ecriture de l'admin sont bloquees
// et repondent 503 avec un message de capacite de stockage atteinte.
export const SERVICE_LOCKED = true;

export const SERVICE_LOCK_STATUS = 503;
export const SERVICE_LOCK_CODE = "STORAGE_CAPACITY_LIMIT";
export const SERVICE_LOCK_TITLE = "503 — Service Unavailable";

export const SERVICE_LOCK_LINES = [
  "Storage capacity limit reached.",
  "The service is temporarily unable to process this operation.",
  "Please retry later or contact the system administrator.",
];

export const SERVICE_LOCK_DETAIL = SERVICE_LOCK_LINES.join(" ");

export function serviceLockResponse() {
  return Response.json(
    {
      error: SERVICE_LOCK_DETAIL,
      title: SERVICE_LOCK_TITLE,
      detail: SERVICE_LOCK_DETAIL,
      lines: SERVICE_LOCK_LINES,
      code: SERVICE_LOCK_CODE,
    },
    {
      status: SERVICE_LOCK_STATUS,
      headers: {
        "Retry-After": "3600",
        "Cache-Control": "no-store",
      },
    },
  );
}
