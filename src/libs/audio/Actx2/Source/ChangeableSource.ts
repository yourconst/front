import { Source } from './Source';
import { MediaSource, type MediaSourceTypes } from './MediaSource';
import { BufferSource, type BufferSourceTypes } from './BufferSource';

export type SourceTypes = MediaSourceTypes | BufferSourceTypes;

const possibleSources = [BufferSource, MediaSource];

export class ChangeableSource extends Source<SourceTypes, Source> {
    get paused() { return this.node?.paused ?? true; }

    get duration() { return this.node?.duration ?? null; }

    get currentTime() { return this.node?.currentTime ?? null; }
    set currentTime(value) { if(this.node) this.node.currentTime = value; }

    protected async _play() {
        await this.node?.play();
    }
    protected _pause() {
        this.node?.pause();
    }

    protected get node() { return super.node; }
    protected set node(value) {
        super.node?.destructor(true);

        super['_node'] = value;

        value.addEventListener('change', () => this.emit('change', this));
        value.addEventListener('durationchange', () => this.emit('durationchange', this));
        value.addEventListener('end', () => this.emit('end', this));
        value.addEventListener('load', () => this.emit('load', this));
        value.addEventListener('loadstart', () => this.emit('loadstart', this));
        value.addEventListener('pause', () => this.emit('pause', this));
        value.addEventListener('play', () => this.emit('play', this));
    }

    async setSource(rawSource: SourceTypes) {
        for (const PossibleSource of possibleSources) {
            if (PossibleSource.isSupportedSource(rawSource)) {
                if (this.node instanceof PossibleSource) {
                    await this.node.setSource(<any> rawSource);
                } else {
                    const played = !this.paused;
                    this.node = new PossibleSource(this.context, this.gainNode);
                    await this.node.setSource(rawSource);
                    if (played) {
                        await this.node.play();
                    }
                }

                return this;
            }
        }

        throw new Error('Unsupported source');
    }

    destructor() {
        this.node?.destructor();
        super.destructor();
    }
}
