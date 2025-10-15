export class Detector {
  constructor(modelType = 'coco-ssd') {
    this.modelType = modelType;
    this.model = null;
  }

  async init() {
    if (this.modelType === 'coco-ssd') {
      this.model = await cocoSsd.load();
    }
    // Add other models later (MoveNet, custom)
  }

  async detect(video) {
    if (!this.model) return [];
    const predictions = await this.model.detect(video);
    return predictions;
  }
}
