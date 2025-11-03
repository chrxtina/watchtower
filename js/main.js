import { VideoCapture } from './videoCapture.js';
import { Detector } from './detector.js';
import { CanvasRenderer } from './canvasRenderer.js';
import { AlertManager } from './alertManager.js';

let video, detector, renderer, alerts;
let predictions = [];
let lastDetectionTime = 0;
// Only detect every Nth frame to reduce CPU load
let detectionInterval = 200; // ms between detections
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

  const frameStart = performance.now();
  renderer.clear();
  renderer.drawVideo(video.getVideo());
  renderer.drawZone(zone);

  const now = performance.now();

  // FPS calculation (smoothed)
  loop.fpsHistory = loop.fpsHistory || [];
  const delta = now - (loop.lastTime || now);
  loop.lastTime = now;

  const fps = 1000 / delta;
  loop.fpsHistory.push(fps);
  if (loop.fpsHistory.length > 30) loop.fpsHistory.shift();
  const avgFPS = loop.fpsHistory.reduce((a, b) => a + b, 0) / loop.fpsHistory.length;

  // Detection
  let detectionLatency = 0;
  if (now - lastDetectionTime > detectionInterval) {
    const detectStart = performance.now();
    predictions = await detector.detect(video.getVideo());
    detectionLatency = performance.now() - detectStart;
    lastDetectionTime = now;

    // Smooth detection latency
    loop.latencyHistory = loop.latencyHistory || [];
    loop.latencyHistory.push(detectionLatency);
    if (loop.latencyHistory.length > 30) loop.latencyHistory.shift();
  }

  const avgLatency = (loop.latencyHistory || []).length
    ? loop.latencyHistory.reduce((a, b) => a + b, 0) / loop.latencyHistory.length
    : 0;

  // JS Heap Memory (Chrome only)
  let memUsed = 0, memTotal = 0;
  if (performance.memory) {
    memUsed = performance.memory.usedJSHeapSize / 1048576; // MB
    memTotal = performance.memory.totalJSHeapSize / 1048576; // MB
  }

  renderer.drawBoxes(predictions);

  // Draw overlay info
  const ctx = renderer.ctx;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(5, 5, 230, 80);
  ctx.fillStyle = 'yellow';
  ctx.font = '14px monospace';
  ctx.fillText(`FPS: ${avgFPS.toFixed(1)}`, 10, 20);
  ctx.fillText(`Latency: ${avgLatency.toFixed(1)} ms`, 10, 40);
  if (performance.memory)
    ctx.fillText(`Memory: ${memUsed.toFixed(1)} / ${memTotal.toFixed(1)} MB`, 10, 60);

// Calculate the min/max X and Y coordinates of the dynamic zone
  const x_coords = zone.map(p => p[0]);
  const y_coords = zone.map(p => p[1]);
  const minX = Math.min(...x_coords);
  const maxX = Math.max(...x_coords);
  const minY = Math.min(...y_coords);
  const maxY = Math.max(...y_coords);

  // Intrusion detection using the dynamic coordinates
  const intrusion = predictions.some(p => {
    if (p.class !== 'person') return false;

    // Calculate the center point of the person's bounding box
    const centerX = p.bbox[0] + p.bbox[2] / 2;
    const centerY = p.bbox[1] + p.bbox[3] / 2;

    // Check if the center point is within the dynamic zone's bounds
    return (
      centerX > minX &&
      centerX < maxX &&
      centerY > minY &&
      centerY < maxY
    );
  });

  if (intrusion) alerts.show('Intrusion detected!');

  animationId = requestAnimationFrame(loop);
}
