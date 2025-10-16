import { VideoCapture } from './videoCapture.js';
import { Detector } from './detector.js';
import { CanvasRenderer } from './canvasRenderer.js';
import { AlertManager } from './alertManager.js';

let video, detector, renderer, alerts;
let predictions = [];
let lastDetectionTime = 0;
let detectionInterval = 200;
let running = false;
let animationId = null;

const zone = [[420,100],[630,100],[630,380],[420,380]];

let draggingPointIndex = null;

document.addEventListener('DOMContentLoaded', async () => {
  const videoEl = document.getElementById('video');
  const canvasEl = document.getElementById('overlay');
  const alertEl = document.getElementById('alert');
  const startBtn = document.getElementById('start-btn');
  const stopBtn = document.getElementById('stop-btn');

  renderer = new CanvasRenderer(canvasEl);
  alerts = new AlertManager(alertEl);

  canvasEl.addEventListener('mousedown', e => {
    const rect = canvasEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    draggingPointIndex = zone.findIndex(([px, py]) => {
      const dx = px - x;
      const dy = py - y;
      return Math.sqrt(dx * dx + dy * dy) < 10; // 10px radius grab area
    });
  });

  canvasEl.addEventListener('mousemove', e => {
    if (draggingPointIndex !== null) {
      const rect = canvasEl.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      zone[draggingPointIndex] = [x, y];
    }
  });

  canvasEl.addEventListener('mouseup', () => {
    draggingPointIndex = null;
  });

  startBtn.addEventListener('click', async () => {
    if (running) return;
    running = true;

    video = new VideoCapture(videoEl);
    await video.init();

    detector = new Detector('coco-ssd');
    await detector.init();

    loop();
    startBtn.disabled = true;
    stopBtn.disabled = false;
  });

  stopBtn.addEventListener('click', async () => {
    running = false;

    if (video ) {
      video.stop();
    }

    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }

    renderer.clear();
    alerts.show('Stream stopped.');
    startBtn.disabled = false;
    stopBtn.disabled = true;
  });
});

async function loop() {
  if (!running) return;

  renderer.clear();
  renderer.drawVideo(video.getVideo());
  renderer.drawZone(zone);

  const now = performance.now();
  if (now - lastDetectionTime > detectionInterval) {
    predictions = await detector.detect(video.getVideo());
    lastDetectionTime = now;
  }

  renderer.drawBoxes(predictions);

  const intrusion = predictions.some(p =>
    p.class === 'person' &&
    p.bbox[0] + p.bbox[2] / 2 > Math.min(...zone.map(pt => pt[0])) &&
    p.bbox[0] + p.bbox[2] / 2 < Math.max(...zone.map(pt => pt[0]))
  );

  if (intrusion) alerts.show('Intrusion detected!');

  animationId = requestAnimationFrame(loop);
}