import { SubSource } from './SubSource';

export type MediaSourceTypes = string | HTMLMediaElement;

export class MediaSource extends SubSource<MediaSource, MediaSourceTypes> {
    element: HTMLMediaElement;
    node: MediaElementAudioSourceNode;

    get volume() { return this.element?.volume || 1; }
    set volume(value) { this.element.volume = Math.max(0, value); }

    get duration() { return this.element?.duration; }

    get currentTime() { return this.element?.currentTime || 0; }
    set currentTime(value) { this.element.currentTime = Math.max(0, value); }

    get channelCount() {
        return this.node.channelCount;
    }

    get paused() { return this.element.paused; }

    async play() {
        await this.element.play();
        return this;
    }
    pause() {
        this.element.pause();
        return this;
    }

    changeTargetNode(targetNode: AudioNode) {
        if (this.targetNode) {
            this.node.disconnect();
        }
        this.node.connect(targetNode);
        this.targetNode = targetNode;
        return this;
    }

    protected clearNode() {
        if (this.element) {
            this.element.src = null;
            delete this.element;
        }

        if (this.node) {
            this.node.disconnect(this.targetNode);
            delete this.node;
        }
    }

    protected createNode() {
        this.node = this.ctx.createMediaElementSource(this.element);
        this.node.connect(this.targetNode);
    }

    setSource(source: MediaSourceTypes) {
        if (source instanceof HTMLMediaElement) {
            this.clearNode();
            this.element = source;
            this.createNode();
        } else {
            if (this.element) {
                this.element.src = source;
            } else {
                this.clearNode();
                this.element = new Audio(source);
                this.createNode();
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

    destructor() {
        this.node?.disconnect();
        delete this.node;
        
        super.destructor();

        this.element.src = null;
        delete this.element;
    }

    static isSupportedSource<T>(rawSource: T): T extends MediaSourceTypes ? true : false {
        return <any>
            (rawSource instanceof HTMLMediaElement) ||
            (typeof rawSource === 'string');
    };
}
