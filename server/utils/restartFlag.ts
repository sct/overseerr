import type { MainSettings } from '../lib/settings';
import { getSettings } from '../lib/settings';

class RestartFlag {
  private settings: MainSettings;

  public initializeSettings(settings: MainSettings): void {
    this.settings = { ...settings };
  }

  public isSet(): boolean {
    const settings = getSettings().main;

    return (
      this.settings.csrfProtection !== settings.csrfProtection ||
      this.settings.trustProxy !== settings.trustProxy
    );
  }
}

const restartFlag = new RestartFlag();

export default restartFlag;
