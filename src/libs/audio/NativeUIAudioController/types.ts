import type EventEmitter from "eventemitter3";

// export interface TrackMetadata {
//     title: string;
//     artist?: string;
//     album?: string;
//     artwork?: ReadonlyArray<{
//         src: string;
//         sizes?: `${number}x${number}`;
//     }>;
// }

export type TrackMetadata = MediaMetadata;

export type NativeUIAudioControllerEvents = {
    play: (details: MediaSessionActionDetails) => void;
    pause: (details: MediaSessionActionDetails) => void;
    stop: (details: MediaSessionActionDetails) => void;
    seekbackward: (details: MediaSessionActionDetails) => void;
    seekforward: (details: MediaSessionActionDetails) => void;
    seekto: (details: MediaSessionActionDetails) => void;
    previoustrack: (details: MediaSessionActionDetails) => void;
    nexttrack: (details: MediaSessionActionDetails) => void;
    // skipad: (details: MediaSessionActionDetails) => void;
    // togglecamera: (details: MediaSessionActionDetails) => void;
    // togglemicrophone: (details: MediaSessionActionDetails) => void;
    // hangup: (details: MediaSessionActionDetails) => void;
};

export interface NativeUIAudioController extends EventEmitter<NativeUIAudioControllerEvents> {
    get metadata(): TrackMetadata;
    set metadata(val: TrackMetadata);

    get playbackState(): MediaSessionPlaybackState;
    set playbackState(val: MediaSessionPlaybackState);

    setPositionState(state: MediaPositionState): this;

    init(): this;

    readonly audio: HTMLAudioElement;

    updateAudio(src?: string): this;

    get paused(): boolean;

    playOrPause(): Promise<this>;

    play(): Promise<this>;
    pause(): this;
    stop(): this;

    previoustrack(): this;
    nexttrack(): this;
}
