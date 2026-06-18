export const ALLOWED_EMAIL_DOMAIN = "@cecar.edu.co";

export function isInstitutionalEmail(email: string | null | undefined) {
  return typeof email === "string" && email.endsWith(ALLOWED_EMAIL_DOMAIN);
}
