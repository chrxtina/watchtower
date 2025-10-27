# WatchTower

WatchTower is a real-time browser-based surveillance project that detects people entering a user-defined intrusion zone. It's designed with **edge-first AI inference**, meaning all detection happens locally, ensuring **low latency** and **privacy**.

## Features

- Live webcam stream with start/stop controls
- Editable intrusion zone drawn on canvas
- Person detection using COCO-SSD
- Alert system when someone enters the zone
- Real-time edge performance metrics
- friendly-face whitelist (planned feature)

## Edge-First Design & Low Latency

All detection and tracking occurs locally in the browser.  
No raw video is sent to any server, ensuring **privacy** and **real-time responsiveness**.

- Lightweight model (COCO-SSD) for detection
- Detection every 200ms to balance CPU load and responsiveness
- FPS and latency displayed in the UI