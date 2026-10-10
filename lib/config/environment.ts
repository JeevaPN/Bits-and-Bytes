import "server-only";

/** Names only: never return or log environment values. */
export const environmentVariableNames = {
  requiredForDatabase: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
  requiredForPrivilegedActions: ["SUPABASE_SERVICE_ROLE_KEY"],
  optionalIntegrations: ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET", "RESEND_API_KEY", "RESEND_FROM_EMAIL", "NEXT_PUBLIC_OSM_TILE_URL", "NEXT_PUBLIC_SITE_URL"],
} as const;

export function getEnvironmentDiagnostics() {
  const all = [...environmentVariableNames.requiredForDatabase, ...environmentVariableNames.requiredForPrivilegedActions, ...environmentVariableNames.optionalIntegrations];
  const present = (name: string) => Boolean(process.env[name]);
  return {
    requiredDatabase: Object.fromEntries(environmentVariableNames.requiredForDatabase.map((name) => [name, present(name)])),
    requiredPrivilegedActions: Object.fromEntries(environmentVariableNames.requiredForPrivilegedActions.map((name) => [name, present(name)])),
    missingPrivilegedActions: environmentVariableNames.requiredForPrivilegedActions.filter((name) => !present(name)),
    optionalIntegrations: Object.fromEntries(environmentVariableNames.optionalIntegrations.map((name) => [name, present(name)])),
    missingRequired: environmentVariableNames.requiredForDatabase.filter((name) => !present(name)),
    configuredCount: all.filter(present).length,
    variableCount: all.length,
  };
}
