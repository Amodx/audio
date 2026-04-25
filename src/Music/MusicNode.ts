import { AudioChannel } from "../Channels/AudioChannel.js";
import { Audio } from "../Audio.js";
import { EffectNodes, MusicTrackData } from "../Meta/AudioTypes.js";

export class MusicNode {
  audioNode: MediaElementAudioSourceNode | null = null;
  audio: HTMLAudioElement | null = null;
  gain: GainNode | null = null;

  constructor(public data: MusicTrackData) {}

  async play(load = true) {
    if (!Audio._initalized) return;
    if (load) {
      await this.load();
    }
    if (!this.audio || !this.audioNode || !this.gain) {
      throw new Error(
        `${this.data.id} is not loaded. Must load before playing`,
      );
    }
    if (this.data.loop) {
      this.audio.loop = true;
    }

    this.gain.gain.value = this.data.level;
    this.audio.play();
  }

  async fadeIn(interval: number, steps: number) {
    if (!Audio._initalized) return;
    if (!this.gain) await this.load();

    this.gain!.gain.value = 0;

    this.audio!.currentTime = 0;
    this.audio!.play();
    if (this.data.loop) {
      this.audio!.loop = true;
    }

    return new Promise((resolve) => {
      const inte = setInterval(() => {
        if (!this.gain || !this.audio) return resolve(false);
        if (this.audio!.paused) return resolve(false);
        if (this.gain!.gain.value >= this.data.level) {
          this.gain!.gain.value = this.data.level;
          resolve(true);
          clearInterval(inte);
          return;
        }

        this.gain!.gain.value += this.data.level / steps;
      }, interval);
    });
  }

  async fadeOut(interval: number, steps: number) {
    if (!Audio._initalized) return;
    if (!this.gain) return false;

    this.gain!.gain.value = this.data.level;

    return new Promise((resolve) => {
      const inte = setInterval(() => {
        if (!this.gain || !this.audio) return resolve(false);
        if (this.audio!.paused) return resolve(false);
        if (this.gain!.gain.value <= 0) {
          this.gain!.gain.value = 0;
          resolve(true);
          clearInterval(inte);
          this.puase();
          return;
        }
        this.gain!.gain.value -= this.data.level / steps;
      }, interval);
    });
  }

  onEnd(func: (this: GlobalEventHandlers, ev: Event) => any) {
    if (!this.audio) return this;
    this.audio.onended = func;
    return this;
  }
  onPause(func: (this: GlobalEventHandlers, ev: Event) => any) {
    if (!this.audio) return this;
    this.audio.onpause = func;
    return this;
  }

  puase() {
    if (!this.audio) return;
    this.audio.pause();
    return this;
  }

  unlLoad() {
    this.audioNode = null;
    this.audio = null;
    if (this.gain) this.gain.dispatchEvent(Audio.api._dissconectEvent);
    this.gain = null;
  }

  load() {
    const channel = Audio.channels.getChannel(this.data.channel);

    const nodes = Audio.api.createAudioElementNode(this.data.path);
    this.audioNode = nodes.audioNode;
    this.audio = nodes.audio;

    this.gain = Audio.api.createGain(this.data.level);
    this.audioNode.connect(this.gain);

    channel.add(this.gain);

    return new Promise((resolve) => {
      nodes.audio.addEventListener("canplay", () => {
        resolve(true);
      });
    });
  }
}
