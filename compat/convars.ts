import { canonicalConvar, legacyConvars } from './names';

export function installConvarCompatibility(runtime: Record<string, any>) {
  const read = runtime.GetConvar;
  if (typeof read !== 'function') return;
  runtime.GetConvar = (name: string, fallback: string): string => {
    const canonical = canonicalConvar(name);
    let result = read(canonical, '');
    if (result !== '') return result;
    for (const legacy of legacyConvars(canonical)) {
      result = read(legacy, '');
      if (result !== '') return result;
    }
    return fallback;
  };
}
