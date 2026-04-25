import { APIManager } from "../API/APIManager";
import { AudioChannelData } from "../Meta/AudioChannelsTypes";
import { AudioChannel } from "./AudioChannel.js";

export class AudioChannelManager {
  static _channels = new Map<string, AudioChannel>();
  static masterLevel = 1;

  static setMasterLevel(level: number) {
    this.masterLevel = level;

    APIManager.main.gain.value = level;
  }

  static registerChannels(channels: AudioChannelData[]) {
    for (const channelData of channels) {
      const channel = new AudioChannel(channelData);
      this._channels.set(channelData.id, channel);
    }
  }

  static getChannel(id: string) {
    const channel = this._channels.get(id);
    if (!channel) throw new Error(`Channel with ${id} does not exist`);
    return channel;
  }
}
