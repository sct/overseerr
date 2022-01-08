import { cloneDeep } from 'lodash';
import Settings, { getSettings } from '../lib/settings';

class RestartFlag {
  private settings: Settings;

  public initializeSettings(settings: Settings): void {
    this.settings = cloneDeep(settings);
  }

  public isSet(): boolean {
    const settings = getSettings();

    return (
      this.settings.main.csrfProtection !== settings.main.csrfProtection ||
      this.settings.main.trustProxy !== settings.main.trustProxy
    );
  }
}

const restartFlag = new RestartFlag();

export default restartFlag;
