export class VideoCapture {
  constructor(videoEl, width = 640, height = 480) {
    this.videoEl = videoEl;
    this.width = width;
    this.height = height;
    this.stream = null;
  }

  async init() {
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { width: this.width, height: this.height },
    });
    this.videoEl.srcObject = this.stream;
    this.videoEl.srcObject = this.stream;
    await this.videoEl.play();
  }

  getVideo() {
    return this.videoEl;
  }

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.videoEl.pause();
      this.videoEl.srcObject = null;
      this.stream = null;
    }
  }
}