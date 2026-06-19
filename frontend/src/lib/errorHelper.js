/**
 * Extract a clean string error message from any API error response.
 * Handles: string, array of pydantic errors, object with detail, etc.
 */
export function getErrorMessage(err) {
  const data = err?.response?.data;
  if (!data) return err?.message || "Something went wrong";

  const detail = data?.detail;
  if (!detail) return err?.message || "Something went wrong";

  // String
  if (typeof detail === "string") return detail;

  // Array of Pydantic validation errors: [{type, loc, msg, input, url}]
  if (Array.isArray(detail)) {
    return detail
      .map((d) => {
        if (typeof d === "string") return d;
        // Pydantic v2 format
        if (d?.msg) {
          const field = d?.loc?.length > 1 ? d.loc[d.loc.length - 1] : null;
          return field ? `${field}: ${d.msg}` : d.msg;
        }
        return JSON.stringify(d);
      })
      .join(", ");
  }

  // Object
  if (typeof detail === "object") return JSON.stringify(detail);

  return String(detail);
}
