class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Int16Array(512);
    this.offset = 0;
    this.sum = 0;
  }
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input && input.length > 0) {
      const channelData = input[0];
      for (let i = 0; i < channelData.length; i++) {
        const s = Math.max(-1, Math.min(1, channelData[i]));
        this.buffer[this.offset++] = s * 0x7fff;
        this.sum += s * s;
        if (this.offset >= this.buffer.length) {
          const rms = Math.sqrt(this.sum / this.buffer.length);
          this.port.postMessage({ buffer: this.buffer.buffer.slice(0), rms });
          this.offset = 0;
          this.sum = 0;
        }
      }
    }
    return true;
  }
}

registerProcessor("audio-processor", AudioProcessor);
