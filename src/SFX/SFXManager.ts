import { Audio } from "../Audio.js";
import { SFXData, SFXPlayOptions } from "../Meta/AudioTypes.js";
import { SFXNode } from "./SFXNode.js";

export class SFXMAnager {
  static _sfxData: Record<string, SFXData> = {};
  static _sfxNodeMap = new Map<string, SFXNode>();
  static _sfxNodes: SFXNode[] = [];
  static _sfxChannels: Record<string, GainNode> = {};

  static update() {
    for (let i = 0; i < this._sfxNodes.length; i++) {
      this._sfxNodes[i].update();
    }
  }

  static play(sfxId: string, options?: SFXPlayOptions) {
    if (!Audio._initalized) return;
    const node = this.getSFXNode(sfxId);
    node.play(options);
  }

  static getSFXNode(sfxId: string) {
    const node = this._sfxNodeMap.get(sfxId);

    if (!node) {
      throw new Error(
        `@amodx/audio: SFX with ID: ${sfxId} does audio nodes are not created.`,
      );
    }

    return node;
  }

  static registerSFX(sfxData: SFXData[]) {
    for (const sfx of sfxData) {
      this._sfxData[sfx.id] = sfx;
    }
  }

  static async createSFXNodes() {
    for (const sfxKey of Object.keys(this._sfxData)) {
      const sfx = this._sfxData[sfxKey];
      const channel = Audio.channels.getChannel(sfx.channel);
      let buffer;
      if (sfx.path) {
        buffer = await Audio.api.loadAudioBuffer(sfx.path);
      }
      if (sfx.rawData) {
        buffer = await Audio.api.creteAudioBuffer(sfx.rawData);
      }
      if (!buffer) {
        throw new Error(
          `@amodx/audio: ${sfx.id} must have a path or raw data set`,
        );
      }
      const node = new SFXNode(channel, sfx, buffer);
      this._sfxNodes.push(node);
      this._sfxNodeMap.set(sfx.id, node);
    }
  }
}
