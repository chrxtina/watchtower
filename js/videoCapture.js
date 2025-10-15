export class VideoCapture {
  constructor(videoEl, width = 640, height = 480) {
    this.video = videoEl;
    this.width = width;
    this.height = height;
  }

  async init() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: this.width, height: this.height }});
    this.video.srcObject = stream;
    await new Promise(r => this.video.onloadedmetadata = r);
    this.video.play();
  }

  getVideo() {
    return this.video;
  }
}