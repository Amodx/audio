export class ConstantsManager {
  static effectsBaesPath = "DAE";
  static customEffectsBaesPath = "DAE/custom";

  static setEffectsBaePath(path: string) {
    this.effectsBaesPath = path;
  }
  static setCustomEffectsBaePath(path: string) {
    this.customEffectsBaesPath = path;
  }
  static getBuiltInReverbPath(id: string) {
    return `${this.effectsBaesPath}/reverb/${id}.wav`;
  }
  static getCustomReverbPath(id: string) {
    return `${this.effectsBaesPath}${id}.wav`;
  }
}
