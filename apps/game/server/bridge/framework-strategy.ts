import { mainLogger } from '../sv_logger';

// Kept as a type for upstream source adapters; none are instantiated here.
export interface Strategy { onStart(): void; init(): void }

// PR Bridge owns character loading and usable items in the internal Lua adapter.
// Old framework convars no longer install duplicate provider lifecycle handlers.
mainLogger.info('Framework integration: PR Bridge (inside Forge NPWD)');
