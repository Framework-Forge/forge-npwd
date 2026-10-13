/** All deprecated names stay here, never in the active phone/app API. */
export const resourceAliases: Record<string, string> = {
  npwd: 'forge-npwd',
  'forge-phone': 'forge-npwd',
  forge_npwd: 'forge-npwd',
  qbx_npwd: 'forge-npwd',
  'forge-npwd-bridge': 'forge-npwd',
  'forge-phone-shop': 'forge-npwd-shop',
  'npwd-forge-management': 'forge-npwd-management',
  npwd_forge_management: 'forge-npwd-management',
  'npwd-forge-weather': 'forge-npwd-weather',
  npwd_forge_weather: 'forge-npwd-weather',
  'npwd-forge-banking': 'forge-npwd-banking',
  npwd_bankingapp: 'forge-npwd-banking',
  'npwd-forge-garage': 'forge-npwd-garage',
  npwd_forge_garage: 'forge-npwd-garage',
  'npwd-forge-housing': 'forge-npwd-housing',
  npwd_forge_housing: 'forge-npwd-housing',
  npwd_forge_mail: 'forge-npwd-mail',
  npwd_qbx_mail: 'forge-npwd-mail',
};
export const exportAliases: Record<string, string> = {
  sendNPWDMessage: 'sendForgeNPWDMessage',
  hasForgePhoneItem: 'hasForgeNPWDItem',
  addForgePhoneItem: 'addForgeNPWDItem',
  removeForgePhoneItem: 'removeForgeNPWDItem',
  setForgePhoneMetadata: 'setForgeNPWDMetadata',
};
export function canonicalName(value: string): string {
  if (typeof value !== 'string') return value;
  const exact = Object.prototype.hasOwnProperty.call(resourceAliases, value) ? resourceAliases[value] : undefined;
  if (exact) return exact;
  for (const [legacy, current] of Object.entries(resourceAliases)) {
    if (value.startsWith(`${legacy}:`)) return current + value.slice(legacy.length);
  }
  return value.replace(/^npwd:forge[-_]([a-z]+)/, 'forge-npwd:$1')
    .replace(/^npwd:/, 'forge-npwd:');
}
export function canonicalProtocolName(value: string): string {
  // The mail/management callbacks originally had an extra forge segment.
  if (typeof value === 'string' && /^npwd:forge[-_]/.test(value)) {
    return value.replace(/^npwd:forge[-_]([a-z]+)/, 'forge-npwd:$1');
  }
  return canonicalName(value);
}
export function canonicalPath(value: string): string {
  if (typeof value !== 'string') return value;
  const path = value.replace(/^\//, '');
  const separator = path.search(/[/?#]/);
  const head = separator < 0 ? path : path.slice(0, separator);
  const rest = separator < 0 ? '' : path.slice(separator);
  return '/' + canonicalName(head) + rest;
}
export function legacyNames(value: string): string[] {
  const aliases = new Set<string>();
  for (const [legacy, current] of Object.entries(resourceAliases)) {
    if (value === current) aliases.add(legacy);
    else if (value.startsWith(`${current}:`)) aliases.add(legacy + value.slice(current.length));
  }
  if (value.startsWith('forge-npwd:')) {
    const rest = value.slice('forge-npwd:'.length);
    aliases.add(`npwd:${rest}`);
    const match = /^(mail|management|weather|garage|housing)(:.*)$/.exec(rest);
    if (match) {
      aliases.add(`npwd:forge_${match[1]}${match[2]}`);
      aliases.add(`npwd:forge-${match[1]}${match[2]}`);
    }
  }
  return [...aliases].filter(alias => alias !== value);
}
export function canonicalConvar(value: string): string {
  return value.replace(/^npwd:/, 'forge-npwd:').replace(/^NPWD_/, 'FORGE_NPWD_');
}
export function legacyConvars(value: string): string[] {
  if (value.startsWith('forge-npwd:')) return [value.replace(/^forge-npwd:/, 'npwd:')];
  if (value.startsWith('FORGE_NPWD_')) return [value.replace(/^FORGE_NPWD_/, 'NPWD_')];
  return [];
}
export function normalizeSavedAppNames<T>(value: T): T {
  // Only application identifiers/routes are migrated; personal text and device metadata aren't.
  if (Array.isArray(value)) return value.map(normalizeSavedAppNames) as T;
  if (!value || typeof value !== 'object') return value;
  const copy: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (typeof item === 'string' && ['appId', 'app', 'application', 'widgetId', 'id', 'iconId', 'applicationId'].includes(key)) {
      copy[key] = canonicalName(item);
    } else if (key === 'path' && typeof item === 'string') {
      copy[key] = canonicalPath(item);
    } else copy[key] = normalizeSavedAppNames(item);
  }
  return copy as T;
}

export function normalizeSavedHome<T extends {pages?: unknown; installedApps?: unknown}>(home: T): T {
  if (!home || typeof home !== 'object') return home;
  const copy = normalizeSavedAppNames(home);
  if (Array.isArray(copy.pages)) copy.pages = copy.pages.map(page =>
    Array.isArray(page) ? page.map(app => typeof app === 'string' ? canonicalName(app) : app) : page);
  if (Array.isArray(copy.installedApps)) copy.installedApps = copy.installedApps.map(app =>
    typeof app === 'string' ? canonicalName(app) : app);
  return copy;
}
