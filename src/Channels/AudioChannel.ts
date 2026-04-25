import type { AudioChannelData } from "../Meta/AudioChannelsTypes";
import { Audio } from "../Audio.js";
import { APIManager } from "../API/APIManager";

export class AudioChannel {
  _level: number;
  get level() {
    return this._level;
  }
  set level(level: number) {
    this._level = level;
    this.main.gain.value = level;
  }
  main: GainNode;

  constructor(public data: AudioChannelData) {
    this._level = data.defaultLevel;
    this.main = APIManager.createGain(this._level);
    Audio.api.connectToMain(this.main);
  }

  add(gain: GainNode) {
    const time = APIManager.context.currentTime;
  //  gain.gain.exponentialRampToValueAtTime(gain.gain.value, time + 0.1);
    gain.connect(this.main);
  }
}
