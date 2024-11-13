export class PlayController {
  status: PlayStatus = PlayStatus.Init;
  constructor() {}
  play() {
    if (this.status !== PlayStatus.Completed) {
      this.status = PlayStatus.Play;
    }
  }
  pause() {
    if (this.status !== PlayStatus.Completed) {
      this.status = PlayStatus.Pause;
    }
  }
  complete() {
    this.status = PlayStatus.Completed;
  }
}
export enum PlayStatus {
  Init,
  Play,
  Pause,
  Completed,
}
