import { SubSource } from "./SubSource";
import { MediaSource, type MediaSourceTypes } from "./MediaSource";
import { BufferSource, type BufferSourceTypes } from "./BufferSource";

export { SubSource } from "./SubSource";

export type SourceTypes = MediaSourceTypes | BufferSourceTypes;

const possibleSources = [BufferSource, MediaSource];

export class Source extends SubSource<Source, SourceTypes> {
    protected _source: SubSource<SubSource<any, any>, SourceTypes> = null;

    get volume() { return this.source?.volume ?? null; }
    set volume(value) { if(this.source) this.source.volume = value; }

    get paused() { return this.source?.paused ?? true; }

    get duration() { return this.source?.duration ?? null; }

    get currentTime() { return this.source?.currentTime ?? null; }
    set currentTime(value) { if(this.source) this.source.currentTime = value; }

    get channelCount() {
        return this.source.channelCount ?? null;
    }

    async play() {
        await this.source?.play();
        return this;
    }
    pause() {
        this.source?.pause();
        return this;
    }

    get source() { return this._source; }
    protected set source(value) {
        this.source?.destructor();

        this._source = value;

        this._source.addListener('change', () => this.emit('change', this));
        this._source.addListener('durationchange', () => this.emit('durationchange', this));
        this._source.addListener('end', () => this.emit('end', this));
        this._source.addListener('load', () => this.emit('load', this));
        this._source.addListener('loadstart', () => this.emit('loadstart', this));
        this._source.addListener('pause', () => this.emit('pause', this));
        this._source.addListener('play', () => this.emit('play', this));
    }

    changeTargetNode(targetNode: AudioDestinationNode) {
        this.source?.changeTargetNode(targetNode);
        this.targetNode = targetNode;
        return this;
    }

    async setSource(rawSource: SourceTypes) {
        for (const SomeSource of possibleSources) {
            if (SomeSource.isSupportedSource(rawSource)) {
                if (this.source instanceof SomeSource) {
                    await this.source.setSource(<any> rawSource);
                } else {
                    const played = !this.paused;
                    this.source = new SomeSource(this.targetNode);
                    if (played) {
                        this.source.play();
                    }
                    await this.source.setSource(<any> rawSource);
                }

                return this;
            }
        }

        throw new Error('Unsupported source');
    }

    destructor() {
        this.source?.destructor();
        delete this.source;
        
        super.destructor();
    }
};
