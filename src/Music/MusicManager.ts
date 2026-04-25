import { MusicTrackData } from "../Meta/AudioTypes";
import { MusicNode } from "./MusicNode.js";
export class MusicManager {
  static _nodes = new Map<string, MusicNode>();

  static play(trackId: string) {
    const node = this.getMusicNode(trackId);
    node.play();
    return node;
  }

  static stop(trackId: string) {
    const node = this.getMusicNode(trackId);
    node.puase();
  }

  static getMusicNode(musicId: string) {
    const node = this._nodes.get(musicId);
    if (!node) {
      throw new Error(`DAE: Music Track with ID: ${musicId} does not exists.`);
    }
    return node;
  }

  static registerMusicTracks(data: MusicTrackData[]) {
    for (const track of data) {
      this._nodes.set(track.id, new MusicNode(track));
    }
  }
}
