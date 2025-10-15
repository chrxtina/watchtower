export class AlertManager {
  constructor(alertEl) {
    this.alertEl = alertEl;
  }

  show(msg, duration = 3000) {
    this.alertEl.textContent = msg;
    this.alertEl.style.display = 'block';
    setTimeout(() => this.alertEl.style.display = 'none', duration);
  }
}