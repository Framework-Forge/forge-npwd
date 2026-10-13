import { canonicalProtocolName, legacyNames } from './names';
import { installConvarCompatibility } from './convars';

export function installClientCompatibility(runtime: Record<string, any>) {
  installConvarCompatibility(runtime);
  const register = runtime.RegisterNuiCallbackType;
  const local = runtime.on;
  const net = runtime.onNet;
  const handlers = new Map<string, (...args: any[]) => unknown>();
  let registeringNetwork = false;
  runtime.RegisterNuiCallbackType = (name: string) => {
    register(name);
    for (const alias of legacyNames(name)) register(alias);
  };
  runtime.onNet = (name: string, handler: (...args: any[]) => unknown) => {
    registeringNetwork = true;
    try {
      net(name, handler);
      for (const alias of legacyNames(name)) net(alias, handler);
    } finally { registeringNetwork = false; }
  };
  runtime.on = (name: string, handler: (...args: any[]) => unknown) => {
    local(name, handler);
    if (registeringNetwork) return;
    if (name.startsWith('__cfx_nui:')) {
      const callback = name.slice('__cfx_nui:'.length);
      handlers.set(callback, handler);
      for (const alias of legacyNames(callback)) local(`__cfx_nui:${alias}`, handler);
    } else for (const alias of legacyNames(name)) local(alias, handler);
  };
  runtime.exports('compatGetNuiCallbacks', () => [...handlers.keys()]);
  runtime.exports('compatInvokeNui', (method: string, data: unknown, response: Function) => {
    const handler = handlers.get(canonicalProtocolName(method));
    let completed = false;
    const answer = (result: unknown = {}) => {
      if (completed) return;
      completed = true;
      response(result);
    };
    if (!handler) return answer({ status: 'error', error: 'unknown_callback' });
    try {
      Promise.resolve(handler(data, answer)).catch(() => answer({ status: 'error', error: 'callback_failed' }));
    } catch { answer({ status: 'error', error: 'callback_failed' }); }
  });
}
if (typeof global.onNet === 'function') installClientCompatibility(global as any);
