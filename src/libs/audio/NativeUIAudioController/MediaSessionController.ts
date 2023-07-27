import EventEmitter from "eventemitter3";
import type { NativeUIAudioController, NativeUIAudioControllerEvents, TrackMetadata } from "./types";
import silence from '../15-seconds-of-silence.mp3';
import { Helpers } from "../../../helpers/common";

export class MediaSessionController
    extends EventEmitter<NativeUIAudioControllerEvents>
    implements NativeUIAudioController
{
    static readonly mediaSession = window.navigator.mediaSession;
    private readonly mediaSession = window.navigator.mediaSession;
    private _trySetActionHandler(action: MediaSessionAction, handler: MediaSessionActionHandler) {
        try {
            this.mediaSession.setActionHandler(action, handler);
            return true;
        } catch (error) {
            return false;
        }
    }
    audio: HTMLAudioElement;

    constructor() {
        super();
    }

    private _inited = false;
    init() {
        this.updateAudio();

        if (this._inited) {
            return this;
        }
        this._inited = true;

        this._trySetActionHandler('play', details => {
            this.play();
        });
        this._trySetActionHandler('pause', details => {
            this.pause();
        });
        // this._trySetActionHandler('stop', details => this.emit('stop', details));
        this._trySetActionHandler('seekto', details => this.emit('seekto', details));
        this._trySetActionHandler('nexttrack', details => this.emit('nexttrack', details));
        this._trySetActionHandler('previoustrack', details => this.emit('previoustrack', details));
        // if (Helpers.Platform.isDesktop()) {
        //     this._trySetActionHandler('seekbackward', details => this.emit('seekbackward', details));
        //     this._trySetActionHandler('seekforward', details => this.emit('seekforward', details));
        // }

        return this;
    }

    updateAudio(src = silence) {
        if (this.audio) {
            this.audio?.pause();
            this.audio.src = null;
        }

        this.audio = new Audio(src);
        this.audio.volume = 1;
        this.audio.loop = false;

        return this;
    }

    get metadata() {
        return this.mediaSession.metadata;
    }
    set metadata(val: TrackMetadata) {
        this.mediaSession.metadata = new MediaMetadata({ ...val, artwork: [...val.artwork] });
    }

    get playbackState() {
        return this.mediaSession.playbackState;
    }
    set playbackState(val) {
        this.mediaSession.playbackState = val;
    }

    setPositionState(state: MediaPositionState) {
        this.mediaSession.setPositionState(state);

        return this;
    }

    get paused() {
        return this.playbackState !== 'playing';
    }

    async playOrPause() {
        if (this.paused) {
            return await this.play();
        }
        return this.pause();
    }

    async play() {
        if (this.playbackState !== 'playing' || this.audio?.paused !== false) {
            await this.audio?.play();
            this.playbackState = 'playing';
            this.emit('play', { action: 'play' });
        }
        return this;
    }

    pause() {
        if (this.playbackState !== 'paused' || this.audio?.paused !== true) {
            this.audio?.pause();
            this.playbackState = 'paused';
            this.emit('pause', { action: 'pause' });
        }
        return this;
    }

    stop() {
        if (this.playbackState !== 'none' || this.audio?.paused !== true) {
            this.audio?.pause();
            this.playbackState = 'none';
            this.emit('stop', { action: 'stop' });
        }
        return this;
    }


    previoustrack() {
        this.emit('previoustrack', { action: 'previoustrack' });
        return this;
    }

    nexttrack() {
        this.emit('nexttrack', { action: 'nexttrack' });
        return this;
    }
}
