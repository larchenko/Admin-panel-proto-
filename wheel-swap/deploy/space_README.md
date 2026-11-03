---
title: Wheel Swap
emoji: 🛞
colorFrom: gray
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
license: agpl-3.0
short_description: Try new rims on your car photo
---

# Wheel Swap

Upload a photo of your car and a photo of a rim, choose the current and the new rim
diameter: every visible wheel gets the new rim, in perspective, with the tyre's
sidewall redrawn for the new size.

Runs on CPU. Detection uses Ultralytics YOLOv8 (AGPL-3.0) and MobileSAM; rim cut-out
uses ISNet from rembg. Source: this Space's files.
