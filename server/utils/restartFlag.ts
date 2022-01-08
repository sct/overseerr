class RestartFlag {
  public isSet = false;

  public set(): void {
    this.isSet = true;
  }
}

const restartFlag = new RestartFlag();

export default restartFlag;
