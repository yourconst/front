import EventEmitter from 'eventemitter3';

export abstract class SubSource<ClassType extends SubSource<any, any>, SourceTypes> extends EventEmitter<{
    loadstart: (src: ClassType) => void,
    load: (src: ClassType) => void,
    change: (src: ClassType) => void,
    end: (src: ClassType) => void,
    durationchange: (src: ClassType) => void,
    play: (src: ClassType) => void,
    pause: (src: ClassType) => void,
    destruct: (src: ClassType) => void,
}> {
    ctx: AudioContext;
    targetNode: AudioNode;
    // node: MediaElementAudioSourceNode | AudioBufferSourceNode;

    abstract get volume(): number;
    abstract set volume(value: number);

    abstract get duration(): number;

    abstract get currentTime(): number;
    abstract set currentTime(value: number);

    abstract get channelCount(): number;

    abstract get paused(): boolean;

    abstract play(): Promise<this>;
    abstract pause(): this;

    abstract changeTargetNode(targetNode: AudioNode): this;

    abstract setSource(rawSource: SourceTypes): this | Promise<this>;

    // static isSupportedSource<SourceTypes, T>(rawSource: T): T extends SourceTypes ? true : false {
    //     throw new Error('Abstract method `isSupportedSource` must be redefined');
    // };

    get destructed() {
        return !this.targetNode;
    }

    destructor() {
        console.log('Destruct: ', this.destructed, this);
        if (this.destructed) {
            return;
        }

        delete this.targetNode;
        delete this.ctx;

        this.emit('destruct', <any> this);

        this.removeAllListeners();
    }
    
    constructor(targetNode: AudioNode) {
        super();

        this.ctx = <AudioContext> targetNode.context;
        this.targetNode = targetNode;
    }
}
