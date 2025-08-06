# Models Directory

This directory will contain the converted TensorFlow.js Spleeter models for audio stem separation.

## Current Status
- The ML implementation uses mock inference for development
- In production, you would place converted Spleeter models here:
  - `spleeter/2stems/model.json` - 2-stem separation (vocals/accompaniment)
  - `spleeter/4stems/model.json` - 4-stem separation (vocals/drums/bass/other)
  - `spleeter/5stems/model.json` - 5-stem separation (vocals/drums/bass/piano/other)

## Converting Spleeter Models
To use real Spleeter models, you would need to:
1. Train or download Spleeter models from Deezer's repository
2. Convert them to TensorFlow.js format using tensorflowjs_converter
3. Place the converted models in the appropriate directories

For now, the system falls back to mock inference and basic frequency filtering.