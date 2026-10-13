import { generateUniquePhoneNumber } from '../misc/generateUniquePhoneNumber';
import { bridgeLogger } from './bridge.utils';
import { config } from '@forge-npwd/config/server';
import { ExportedPlayerData, PlayerAddData } from '../players/player.interfaces';
import { playerLogger } from '../players/player.utils';
import PlayerService from '../players/player.service';
import { Player } from '../players/player.class';
import callsService from '../calls/calls.service';

const exp = global.exports;

const logExport = (exportName: string, msg: string) => {
  bridgeLogger.debug(`[${exportName}] ${msg}`);
};

// Will generate and return a unique phone number
exp('generatePhoneNumber', async () => {
  const num = await generateUniquePhoneNumber();
  logExport('generatePhoneNumber', num);
  return num;
});

// For multicharacter frameworks, we enable these events for
// instantiating/deleting a player. The config option must be set to true
// for these to be available
if (config.general.useResourceIntegration) {
  exp('newPlayer', async (playerDTO: PlayerAddData, complete?: (success: boolean) => void, isCurrent?: () => boolean) => {
    let success = false;
    try {
      if (!playerDTO || !Number.isInteger(playerDTO.source) || playerDTO.source < 1
        || typeof playerDTO.identifier !== 'string' || !playerDTO.identifier.trim()) {
        throw new Error('A positive source and character identifier are required');
      }
      success = await PlayerService.handleNewPlayerEvent(playerDTO, isCurrent);
    } catch (error) {
      playerLogger.error(`Failed to load Forge NPWD player: ${error.message}`);
    }
    if (typeof complete === 'function') complete(success);
    return success;
  });

  exp('unloadPlayer', async (src: number) => {
    if (typeof src !== 'number') {
      return playerLogger.error('Source must be passed as a number when unloading a player');
    }
    playerLogger.debug(`Received unloadPlayer event for ${src}`);
    try {
      await PlayerService.handleUnloadPlayerEvent(src);
    } catch (error) {
      playerLogger.error(`Failed to unload Forge NPWD player: ${error.message}`);
    }
  });
}

exp('getPhoneNumber', (src: number): string => {
  playerLogger.error(
    '[DEPRECATION WARNING]: deprecated export getPhoneNumber called, please use getPlayerData',
  );
  return PlayerService.getPlayer(src).getPhoneNumber();
});

interface PlayerDataExportArgs {
  source?: string | number;
  identifier?: string;
  phoneNumber?: string;
}

/**
 * Returns an object containing various player data that NPWD stores
 * @param locator: Object that must contain 1 of either a source, identifier or phone number
 */
exp('getPlayerData', async (locator: PlayerDataExportArgs): Promise<ExportedPlayerData | null> => {
  let player: Player;

  if (locator.source) {
    player = PlayerService.getPlayer(
      typeof locator.source === 'string' ? parseInt(locator.source) : locator.source,
    );
  }

  if (locator.identifier) {
    player = PlayerService.getPlayerFromIdentifier(locator.identifier);
  }

  if (locator.phoneNumber) {
    player = PlayerService.getPlayerFromPhoneNumber(locator.phoneNumber);
  }

  if (!player) return null;

  return {
    phoneNumber: player.getPhoneNumber(),
    firstName: player.getFirstName(),
    lastName: player.getLastName(),
    name: player.getName(),
    identifier: player.getActiveOwnerIdentifier() || player.getIdentifier(),
    source: player.source,
  };
});

exp('isPlayerBusy', (src: number): boolean => {
  return PlayerService.isBusy(src);
});


exp("isPhoneNumberBusy", (phoneNumber: string) => {
  return callsService.isPhoneNumberInCall(phoneNumber);
})
