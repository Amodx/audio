import {
  BiquadFilterNodeData,
  DynamicCompressorData,
  PannerNodeData,
} from "../Meta/APITypes";

export class APIManager {
  static context: AudioContext;

  static _dissconectEvent = new Event("disconnect");

  static compressionEnabled = true;
  static compression: DynamicsCompressorNode;
  static main: GainNode;

  static pannerNodeDefaults: Partial<PannerNodeData> = {
    panningModel: "HRTF",
    distanceModel: "exponential",
  };

  static init() {
    if (typeof AudioContext === "undefined") {
      throw new Error(
        "@amodx/auido: AudioContext is not found. This browser is not suppourted.",
      );
    }

    this.context = new AudioContext();

    this.main = this.context.createGain();
    this.main.gain.value = 1;

    if (this.compressionEnabled) {
      this.compression = this.context.createDynamicsCompressor();
      this.compression.threshold.value = -24;
      this.compression.knee.value = 30;
      this.compression.ratio.value = 4;
      this.compression.attack.value = 0.003;
      this.compression.release.value = 0.25;

      this.main.connect(this.compression);
      this.compression.connect(this.context.destination);
    } else {
      this.main.connect(this.context.destination);
    }
  }

  static connectToMain(node: AudioNode) {
    node.connect(this.main);
  }

  static createAudioBufferSource(buffer: AudioBuffer) {
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    return source;
  }

  static createDynamicCompressor(data: DynamicCompressorData) {
    const comp = this.context.createDynamicsCompressor();
    if (data.threshold != undefined) {
      comp.threshold.value = data.threshold;
    }
    if (data.knee != undefined) {
      comp.knee.value = data.knee;
    }
    if (data.ratio != undefined) {
      comp.ratio.value = data.ratio;
    }
    if (data.attack != undefined) {
      comp.attack.value = data.attack;
    }
    if (data.release != undefined) {
      comp.release.value = data.release;
    }
    return comp;
  }

  /*
  https://developer.mozilla.org/en-US/docs/Web/API/WaveShaperNode
  */
  static createWaveShapeNode(
    curve: Float32Array<any>,
    oversample?: OverSampleType,
  ) {
    const node = this.context.createWaveShaper();
    node.curve = curve;
    if (oversample) {
      node.oversample = oversample;
    }
  }

  static createGain(value: number = 1) {
    const gain = this.context.createGain();
    gain.gain.value = value;
    return gain;
  }

  static createDelayNode(delayTime: number) {
    const delay = this.context.createDelay();
    delay.delayTime.value = delayTime;
    return delay;
  }

  static createBiQuadFilterNode(data: BiquadFilterNodeData) {
    const filter = this.context.createBiquadFilter();
    filter.type = data.type;
    filter.frequency.value = data.frequency;
    if (data.Q != undefined) {
      filter.Q.value = data.Q;
    }
    if (data.detune != undefined) {
      filter.detune.value = data.detune;
    }
    return filter;
  }

  static createConvolver(buffer: AudioBuffer) {
    const convolver = this.context.createConvolver();
    convolver.buffer = buffer;
    return convolver;
  }

  static createPannerNode(nodeData?: Partial<PannerNodeData>) {
    const context = this.context;
    if (nodeData?.distanceModel) {
      nodeData.distanceModel = this.pannerNodeDefaults.distanceModel;
    }
    if (nodeData?.panningModel) {
      nodeData.panningModel = this.pannerNodeDefaults.panningModel;
    }

    return new PannerNode(context, nodeData);
  }

  static async loadAudioBuffer(path: string): Promise<AudioBuffer> {
    const response = await fetch(path);
    const buffer = await response.arrayBuffer();
    const source = await APIManager.context.decodeAudioData(buffer);
    return source;
  }

  static async creteAudioBuffer(data: Uint8Array<any>): Promise<AudioBuffer> {
    const source = await APIManager.context.decodeAudioData(data.buffer);
    return source;
  }

  static createAudioElementNode(path: string) {
    const audio = new Audio(path);
    const audioNode = APIManager.context.createMediaElementSource(audio);
    return {
      audio,
      audioNode,
    };
  }
}
