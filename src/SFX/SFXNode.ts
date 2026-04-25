import { APIManager } from "../API/APIManager";
import { AudioChannel } from "../Channels/AudioChannel";
import { Audio } from "../Audio.js";
import { SFXData, SFXPlayOptions } from "../Meta/AudioTypes";
import { PannerNodeData } from "Meta/APITypes";

class SFXInstance {
  source: AudioBufferSourceNode | null = null;
  private startTime: number;
  private duration: number;
  constructor(
    public gain: GainNode,
    public panner: PannerNode | null,
  ) {}

  start(source: AudioBufferSourceNode) {
    this.source = source;
    this.startTime = APIManager.context.currentTime;
    this.duration = source.buffer
      ? source.buffer.duration / source.playbackRate.value
      : 0;
    source.start(0);
  }

  isDone(): boolean {
    return APIManager.context.currentTime >= this.startTime + this.duration;
  }
}

const defaultPannerNodeData: PannerNodeData = {
  panningModel: "equalpower",
  distanceModel: "inverse",
  positionX: 0,
  positionY: 0,
  positionZ: 0,
  orientationX: 1,
  orientationY: 0,
  orientationZ: 0,
  refDistance: 1,
  maxDistance: 10000,
  rolloffFactor: 1,
  coneInnerAngle: 360,
  coneOuterAngle: 360,
  coneOuterGain: 0,
};
export class SFXNode {
  playingSFXInstances = new Set<SFXInstance>();
  endedSFXInstances: SFXInstance[] = [];

  constructor(
    public channel: AudioChannel,
    public data: SFXData,
    public buffer: AudioBuffer,
  ) {
    if (data.is3dSound) {
      if (data.varations) {
        for (const vara of data.varations) {
          vara._3dSoundPosition = {
            x: 0,
            y: 0,
            z: 0,
          };
          vara._3dSoundData = structuredClone(defaultPannerNodeData);
        }
      }
    }
  }

  update() {
    for (const playing of this.playingSFXInstances) {
      if (playing.isDone()) {
        playing.source?.disconnect();
        playing.source = null;
        this.playingSFXInstances.delete(playing);
        this.endedSFXInstances.push(playing);
      }
    }
  }

  getOptions() {
    const length = this.data.varations!.length;
    const index = Math.floor(Math.random() * length);
    return this.data.varations![index];
  }

  private _getPannerData(options: SFXPlayOptions) {
    let pannerData = this.data._3dSoundData;
    if (!this.data._3dSoundData && options?._3dSoundData) {
      pannerData = options._3dSoundData;
    }
    if (!options?._3dSoundPosition) {
      throw new Error(`Must provide a postion to play a 3d sound.`);
    }

    if (!pannerData) {
      pannerData = defaultPannerNodeData;
    }
    pannerData.positionX = options._3dSoundPosition.x;
    pannerData.positionY = options._3dSoundPosition.y;
    pannerData.positionZ = options._3dSoundPosition.z;
    return pannerData;
  }

  private _updatePanner(data: Partial<PannerNodeData>, panner: PannerNode) {
    // AudioParam properties (use .value)
    panner.positionX.value = data.positionX ?? 0;
    panner.positionY.value = data.positionY ?? 0;
    panner.positionZ.value = data.positionZ ?? 0;

    panner.orientationX.value = data.orientationX ?? 1;
    panner.orientationY.value = data.orientationY ?? 0;
    panner.orientationZ.value = data.orientationZ ?? 0;

    // Standard properties (set directly)
    if (data.panningModel) panner.panningModel = data.panningModel;
    if (data.distanceModel) panner.distanceModel = data.distanceModel;

    panner.refDistance = data.refDistance ?? 1;
    panner.maxDistance = data.maxDistance ?? 10000;
    panner.rolloffFactor = data.rolloffFactor ?? 1;

    panner.coneInnerAngle = data.coneInnerAngle ?? 360;
    panner.coneOuterAngle = data.coneOuterAngle ?? 360;
    panner.coneOuterGain = data.coneOuterGain ?? 0;
  }

  play(options?: SFXPlayOptions) {
    if (!Audio._initalized) return;

   // if (this.playingSFXInstances.size > 30) return;

    if (options && this.data.varations) {
      let newOption = this.getOptions();
      if (options._3dSoundPosition) {
        newOption._3dSoundPosition!.x = options._3dSoundPosition.x;
        newOption._3dSoundPosition!.y = options._3dSoundPosition.y;
        newOption._3dSoundPosition!.z = options._3dSoundPosition.z;
      }
      if (options._3dSoundData) {
        newOption._3dSoundData = options._3dSoundData;
      }
      if (options.dryLevel) newOption!.dryLevel = options.dryLevel;
      if (options.level) newOption!.level = options.level;
      options = newOption;
    }

    if (!options && this.data.varations) {
      let opt = this.getOptions();
      if (opt) options = opt;
    }
    const source = Audio.api.createAudioBufferSource(this.buffer);

    if (this.data.loop) {
      source.loop = true;
    }
    if (options?.playBackRate !== undefined) {
      source.playbackRate.value = options.playBackRate;
    }

    const usedNode = this.endedSFXInstances.pop();
    if (usedNode) {
      if (usedNode.panner && options) {
        this._updatePanner(this._getPannerData(options), usedNode.panner);
        source.connect(usedNode.panner);
      } else {
        source.connect(usedNode.gain);
      }
      usedNode.gain.gain.value = options?.level ?? 1;

      usedNode.start(source);
      this.playingSFXInstances.add(usedNode);
      return;
    }

    const gain = Audio.api.createGain();
    gain.gain.value = options?.level ?? 1;

    let panner: PannerNode | null = null;
    if (this.data.is3dSound && options) {
      panner = APIManager.createPannerNode();
      this._updatePanner(this._getPannerData(options), panner);
      source.connect(panner);
      panner.connect(gain);
    } else {
      source.connect(gain);
    }

    this.channel.add(gain);
    const node = new SFXInstance(gain, panner);
    node.start(source);
    this.playingSFXInstances.add(node);
  }
}
