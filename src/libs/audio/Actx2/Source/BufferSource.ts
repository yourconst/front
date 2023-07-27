import { Helpers } from '../../../../helpers/common';
import { Source } from './Source';

export type BufferSourceTypes = ArrayBuffer | ReadableStream<Uint8Array | ArrayBuffer> | string;

export class BufferSource extends Source<BufferSourceTypes, AudioBufferSourceNode> {
    static isSupportedSource<T>(rawSource: T): T extends BufferSourceTypes ? true : false {
        return <any>
            (rawSource instanceof ArrayBuffer) ||
            (rawSource instanceof ReadableStream) ||
            (typeof rawSource === 'string' && !rawSource.startsWith('data:'));
    }

    readonly minBufferLength = 2e5;

    loadId = 0;
    protected startOffset = 0;
    protected startTime = 0;

    protected loaded = false;

    protected _paused = true;
    audioBuffer: AudioBuffer;

    destructor(saveGain?: boolean) {
        this.clearNode();
        delete this.audioBuffer;
        
        super.destructor(saveGain);
    }

    get duration() { return this.audioBuffer?.duration ?? 0; }

    get currentTime() {
        let playing = this.paused ? 0 : this.context.currentTime - this.startTime;

        return (this.startOffset + playing) % this.duration;
    }
    set currentTime(value) {
        this.startOffset = Math.max(0, value);

        if (!this.paused) {
            this._startFrom();
        }
    }

    get channelCount() {
        return this.node.channelCount;
    }

    get paused() {
        return this._paused;
    }
    
    clearNode() {
        if (this.node) {
            this.node.onended = null;
        }

        super.clearNode();
    }

    set node(value) {
        this.node?.stop();
        super.node = value;

        this.node.onended = () =>  {
            if (!this.loaded) {
                this.pause();
                return;
            }

            if(!this.node.loop) {
                this._paused = true;
            }

            this.startOffset = 0;
            this.emit('pause', this);
            this.emit('end', this);
        };
    }

    protected async _startFrom(offset = this.startOffset) {
        this.startOffset = offset;

        if (this.audioBuffer) {
            this.clearNode();

            this.startTime = this.context.currentTime;

            this.node = this.context.createBufferSource();
            this.node.buffer = this.audioBuffer;

            //this.node.loop = true;

            this.node.start(0, this.startOffset % this.duration);
            this.emit('play', this);
        }

        this._paused = false;
    }

    protected async _play() {
        if (this._paused) {
            await this._startFrom();
        }
    }
    protected _pause() {
        if (this._paused) {
            return;
        }
        this.clearNode();
        this.startOffset += this.context.currentTime - this.startTime;
        this._paused = true;

        this.emit('pause', this);
    }

    protected async changeBuffer(buffer: ArrayBuffer, loadId: number, needRestart = false) {
        const audioBuffer = await this.context.decodeAudioData(buffer);

        if (this.loadId > loadId) {
            return false;
        }

        const isPlaying = !this.paused;

        this.audioBuffer = audioBuffer;
        this.pause();

        if (needRestart) {
            this.currentTime = 0;
        }

        if (isPlaying) {
            this._startFrom();
        }

        this.emit('durationchange', this);
        // this.emit('change', this);

        return true;
    }

    protected async setSourceBuffer(sourceBuffer: ArrayBuffer) {
        this.loaded = false;
        this.emit('loadstart', this);
        this.emit('change', this);

        const partLength = Math.min(this.minBufferLength, sourceBuffer.byteLength);
        const loadId = ++this.loadId;

        if (!await this.changeBuffer(sourceBuffer.slice(0, partLength), loadId, true)) {
            return this;
        }

        if (partLength !== sourceBuffer.byteLength) {
            if (!await this.changeBuffer(sourceBuffer.slice(0), loadId)) {
                return this;
            }
        }
        // await this.changeBuffer(sourceBuffer.slice(0), loadId, true);

        this.loaded = true;
        this.emit('load', this);

        return this;
    }

    protected async setSourceStream(sourceStream: ReadableStream<Uint8Array | ArrayBuffer>) {
        this.loaded = false;
        this.emit('loadstart', this);
        this.emit('change', this);

        let buffer = new ArrayBuffer(0);
        const loadId = ++this.loadId;

        const reader = sourceStream.getReader();
        let isFirstPart = true;
        
        while (true) {
            const { done, value } = await reader.read();

            const partBuffer =
                value instanceof Uint8Array ?
                value.buffer :
                value instanceof ArrayBuffer ?
                value :
                null;

            if (partBuffer?.byteLength) {
                buffer = Helpers.ArrayBuffer.concat(buffer, partBuffer);

                if ((buffer.byteLength >= this.minBufferLength) || done) {
                    try {
                        if (this.destructed || !await this.changeBuffer(buffer.slice(0), loadId, isFirstPart)) {
                            await reader.cancel();
                            // await sourceStream.cancel();
                            break;
                        }

                        isFirstPart = false;
                    } catch (error) {
                        console.warn({
                            message: 'Continue decoding',
                            error,
                        });
                    }
                }
            }
            
            if (done) {
                break;
            }

            await Helpers.sleep(100);
        }

        this.loaded = true;
        this.emit('load', this);

        return this;
    }

    async setSource(rawSource: BufferSourceTypes) {
        const paused = this._paused;
        this.pause();
        delete this.audioBuffer;
        this.currentTime = 0;
        this._paused = paused;

        if (rawSource instanceof ArrayBuffer) {
            return this.setSourceBuffer(rawSource);
        }

        if (rawSource instanceof ReadableStream) {
            return this.setSourceStream(rawSource);
        }

        if (typeof rawSource === 'string') {
            const response = await fetch(rawSource);
            return this.setSourceStream(response.body);
            
        }

        throw new Error('Bad source');
    }
}
