import { resourceAliases } from './names';

/** Only known resource hosts are rewritten; external URLs stay intact. */
export function canonicalNuiUrl(value: string): string {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return value;
    const host = url.hostname;
    const prefix = host.startsWith('cfx-nui-') ? 'cfx-nui-' : '';
    const name = prefix ? host.slice(prefix.length) : host;
    const canonical = Object.prototype.hasOwnProperty.call(resourceAliases, name)
      ? resourceAliases[name] : undefined;
    if (!canonical) return value;
    url.hostname = prefix + canonical;
    return url.href;
  } catch { return value; }
}

export function installNuiCompatibility(runtime: Window): void {
  const fetch = runtime.fetch.bind(runtime);
  runtime.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const original = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const canonical = canonicalNuiUrl(original);
    if (canonical === original) return fetch(input, init);
    // Cloning a Request preserves method/body/headers/credentials/signal.
    return fetch(input instanceof Request ? new Request(canonical, input) : canonical, init);
  };
  const open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...rest: any[]) {
    return (open as any).call(this, method, canonicalNuiUrl(String(url)), ...rest);
  } as typeof open;
}

// Install before the phone or any external app captures fetch/XHR.
if (typeof window !== 'undefined' && 'invokeNative' in window) installNuiCompatibility(window);
