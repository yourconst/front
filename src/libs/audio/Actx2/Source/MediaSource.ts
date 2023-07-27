import { Source } from './Source';

export type MediaSourceTypes = string | HTMLMediaElement;

export class MediaSource extends Source<MediaSourceTypes, MediaElementAudioSourceNode> {
    static isSupportedSource<T>(rawSource: T): T extends MediaSourceTypes ? true : false {
        return <any>
            (rawSource instanceof HTMLMediaElement) ||
            (typeof rawSource === 'string');
    }

    get element() { return this.node?.mediaElement; }

    // get volume() { return this.element.volume || 1; }
    // set volume(value) { this.element.volume = Math.max(0, value); }

    get duration() { return this.element?.duration; }

    get currentTime() { return this.element?.currentTime || 0; }
    set currentTime(value) { this.element.currentTime = Math.max(0, value); }

    get paused() { return this.element?.paused ?? true; }

    protected async _play() {
        await this.element?.play();
    }
    protected _pause() {
        this.element?.pause();
    }

    protected clearNode() {
        if (this.element) {
            this.element.pause();
            this.element.src = null;
        }

        super.clearNode();
    }

    protected _createNode(element: HTMLMediaElement) {
        this.node = this.context.createMediaElementSource(element);
    }

    setSource(source: MediaSourceTypes) {
        if (source instanceof HTMLMediaElement) {
            this._createNode(source);
        } else {
            if (this.element) {
                this.element.src = source;
            } else {
                this._createNode(new Audio(source));
            }
        }

        // this.element.volume = 1;

        this.element.onchange = () => this.emit('change', this);
        this.element.ondurationchange = () => this.emit('durationchange', this);
        this.element.onended = () => this.emit('end', this);
        this.element.load = () => this.emit('load', this);
        this.element.onloadstart = () => this.emit('loadstart', this);
        this.element.onpause = () => this.emit('pause', this);
        this.element.onplay = () => this.emit('play', this);

        return this;
    }
}
