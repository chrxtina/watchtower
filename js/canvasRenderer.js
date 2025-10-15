export class CanvasRenderer {
  constructor(canvasEl, width = 640, height = 480) {
    this.canvas = canvasEl;
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = width;
    this.canvas.height = height;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawVideo(video) {
    this.ctx.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);
  }

  drawBoxes(predictions) {
    this.ctx.strokeStyle = 'lime';
    this.ctx.lineWidth = 2;
    this.ctx.font = '16px sans-serif';
    this.ctx.fillStyle = 'lime';

    predictions.forEach(p => {
      const [x, y, w, h] = p.bbox;
      this.ctx.strokeRect(x, y, w, h);
      this.ctx.fillText(`${p.class} (${Math.round(p.score*100)}%)`, x, y > 16 ? y-4 : y+14);
    });
  }

  drawZone(zone) {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(255, 0, 0, 0.08)';
    this.ctx.strokeStyle = 'rgba(255,0,0,0.6)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    zone.forEach(([x,y], i) => i===0?this.ctx.moveTo(x,y):this.ctx.lineTo(x,y));
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.restore();
  }
}