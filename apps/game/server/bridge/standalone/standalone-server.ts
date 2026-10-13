import { mainLogger } from '../../sv_logger';
import { Strategy } from '../framework-strategy';

export class Standalone implements Strategy {
  constructor() {
    mainLogger.info('Loading Forge NPWD Standalone');
  }

  init(): void {
    return;
  }

  onStart(): void {
    return;
  }
}
