import type { Actx } from "../Actx";
import { CustomAudioNode } from "../CustomAudioNode";

export type SourceEvents<SourceType extends Source<any>> = {
    loadstart: (src: SourceType) => void,
    load: (src: SourceType) => void,
    change: (src: SourceType) => void,
    end: (src: SourceType) => void,
    durationchange: (src: SourceType) => void,
    play: (src: SourceType) => void,
    pause: (src: SourceType) => void,
    destruct: (src: SourceType) => void,
};

export abstract class Source<SourceTypes = any, NodeType extends AudioNode = AudioNode> extends CustomAudioNode {
    // protected readonly gainNode: GainNode;
    private _node?: NodeType;

    abstract currentTime: number;
    abstract readonly duration: number;

    abstract readonly paused: boolean;

    constructor(context: AudioContext, protected readonly gainNode = context.createGain()) {
        super(context);

        // this.gainNode = this.context.createGain();
    }

    destructor(saveGain = false) {
        this.clearNode();
        if (saveGain) {
            this.gainNode.disconnect();
            // @ts-ignore
            this.gainNode = null;
        }
    }

    protected getNodeIn;
    protected getNodeOut() {
        return this.gainNode;
    }

    get volume() { return this.gainNode.gain.value; }
    set volume(value) { this.gainNode.gain.value = value; }

    protected get node() { return this._node; }
    protected set node(value) {
        this.clearNode();
        this._node = value;
        this._node?.connect(this.gainNode);
    }

    hasNode() {
        return !!this.node;
    }

    protected clearNode() {
        if (!this.node) {
            return;
        }

        this._node.disconnect();
        this._node = null;
    }

    protected abstract _play(): Promise<void>;
    protected abstract _pause(): void;

    abstract setSource(rawSource: SourceTypes): this | Promise<this>;

    async play() {
        globalThis.lastPlayTime = Date.now();
        await this.actx.resume();
        await this._play();
        return this;
    }

    pause() {
        this._pause();
        return this;
    }
}
