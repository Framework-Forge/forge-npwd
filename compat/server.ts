import { legacyNames } from './names';
import { installConvarCompatibility } from './convars';

export function installServerCompatibility(runtime: Record<string, any>) {
  installConvarCompatibility(runtime);
  const net = runtime.onNet;
  const local = runtime.on;
  let registeringNetwork = false;
  runtime.onNet = (name: string, handler: (...args: any[]) => unknown) => {
    // Register the same validated handler for old requests. Source and rate limits stay intact.
    registeringNetwork = true;
    try {
      net(name, handler);
      for (const alias of legacyNames(name)) net(alias, handler);
    } finally { registeringNetwork = false; }
  };
  runtime.on = (name: string, handler: (...args: any[]) => unknown) => {
    local(name, handler);
    if (!registeringNetwork) for (const alias of legacyNames(name)) local(alias, handler);
  };
  // No mirrored emissions: a request can execute once, never twice.
}
if (typeof global.onNet === 'function') installServerCompatibility(global as any);
