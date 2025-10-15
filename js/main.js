import { VideoCapture } from './videoCapture.js';
import { Detector } from './detector.js';
import { CanvasRenderer } from './canvasRenderer.js';
import { AlertManager } from './alertManager.js';

(async () => {
  const videoEl = document.getElementById('video');
  const canvasEl = document.getElementById('overlay');
  const alertEl = document.getElementById('alert');

  const video = new VideoCapture(videoEl);
  await video.init();

  const detector = new Detector('coco-ssd');
  await detector.init();

  const renderer = new CanvasRenderer(canvasEl);
  const alerts = new AlertManager(alertEl);

  const zone = [[420,100],[630,100],[630,380],[420,380]]; // example polygon

  async function loop() {
    renderer.clear();
    renderer.drawVideo(video.getVideo());
    renderer.drawZone(zone);

    const preds = await detector.detect(video.getVideo());
    renderer.drawBoxes(preds);

    // Alert if person enters zone
    const intrusion = preds.some(p => p.class === 'person' && p.bbox[0] + p.bbox[2]/2 > 420 && p.bbox[0] + p.bbox[2]/2 < 630);
    if (intrusion) alerts.show('Intrusion detected!');

    requestAnimationFrame(loop);
  }

  loop();
})();