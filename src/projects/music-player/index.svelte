<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import { NativeUIAudioControllerManager } from '../../libs/audio/NativeUIAudioController';
    import { MusicBrainzApi } from '../../api/musicbrainz';
    import { Helpers } from '../../helpers/common';
    import { Texture } from '../../libs/render/Texture';
    import { TrackInfoParser, type ITrackInfo } from '../../libs/parsers/TrackInfoParser';
    import { Actx } from '../../libs/audio/Actx2/index';

    const nuiac = NativeUIAudioControllerManager.get();
    const actx = new Actx();
    const source = actx.createChangeableSource();
    source.connect(actx);
    const state = {
        nuiac,
        actx,
        source,
        index: -1,
        tracks: <{
            info: ITrackInfo.Track;
            buffer: ArrayBuffer;
            filename: string;
            mime: string;
        }[]> [],
        updateMetadata,
        info: '',
    };
    
    function formatDuration(seconds: number) {
        const _s = seconds >> 0;

        const h = (_s / 60 / 60) >> 0;
        const m = (_s / 60) >> 0;
        const s = _s % 60;

        let arr = [h, m, s];

        arr = arr.slice(Math.min(1, arr.findIndex(v => v)));
        
        return arr.map(v => String(v)).map(v => v.length < 2 ? '0' + v : v).join(':');
    }

    function updateMetadata() {
        const track = state.tracks[state.index];
        if (!track) {
            nuiac.pause();
            return;
        }

        const duration = TrackInfoParser.Parsed.getTrackDuration(track.info, state.source.duration || 10);

        if (isFinite(duration)) {
            nuiac.setPositionState({
                position: state.source.currentTime,
                duration,
                playbackRate: 1,
            });
        }

        const artwork = TrackInfoParser.Parsed.getTrackArtworkMediaImage(track.info);

        // console.warn(state.source.duration, track, artwork);

        nuiac.metadata = {
            title: track.info.title,
            artist: track.info.artists?.map(a => a.name).join(', ') || 'Unknown',
            album: track.info.albums?.map(a => a.title).join(', ') || 'Unknown',
            artwork,
        };
    }

    state.source.addEventListener('durationchange', updateMetadata);

    async function changeTrack(index = state.index) {
        try {
        index = Math.min(state.tracks.length - 1, Math.max(0, index));

        if (state.index === index) {
            if (state.source.paused) {
                await state.nuiac.play();
            } else {
                state.nuiac.pause();
            }
            return;
        }

        state.index = index;
        const track = state.tracks[index];

        if (!track) {
            return;
        }

        if (!state.source.hasNode()) {
            await state.nuiac.audio.play();
            await Helpers.sleep(1111);
            state.nuiac.pause();
            state.nuiac.audio.src = null;
            await state.source.setSource(state.nuiac.audio);
        }
        await state.actx.resume();

        state.nuiac.audio.src = await Helpers.ArrayBuffer.toDataUrl(track.buffer, track.mime || 'audio/mpeg');

        // if (!state.source.source) {
        //     await state.source.setSource(state.nuiac.audio);
        // }
        // await state.source.setSource(track.buffer);

        // await state.actx.play();
        // alert([1, state.nuiac.paused, state.actx.ctx.state, state.actx.paused].join(', '));

        await state.nuiac.play();
        // state.source.play();
        updateMetadata();
        // alert([2, state.nuiac.paused, state.actx.ctx.state, state.actx.paused].join(', '));
        } catch (error) {
            alert('' + error + '\n' + error?.stack);
        }
    }

    state.source.addEventListener('end', () => {
        changeTrack(state.index + 1);
    });

    nuiac.addListener('seekto', (details) => state.source.currentTime = details.seekTime);
    nuiac.addListener('seekbackward', (details) => state.source.currentTime -= Math.abs(details.seekOffset || 5));
    nuiac.addListener('seekforward', (details) => state.source.currentTime += Math.abs(details.seekOffset || 5));
    nuiac.addListener('previoustrack', () => changeTrack(state.index - 1));
    nuiac.addListener('nexttrack', () => changeTrack(state.index + 1));
    nuiac.addListener('play', () => state.source.play());
    nuiac.addListener('pause', () => state.source.pause());

    function updateTracks(index?: number) {
        if (typeof index === 'number') {
            state.tracks[index] = state.tracks[index];
        } else {
            state.tracks = state.tracks;
        }
    }

    function addTrack(buffer: ArrayBuffer, info: ITrackInfo.Track, filename: string, mime: string) {
        state.tracks.push({ filename, buffer, info, mime });
        updateTracks();
        return { track: state.tracks.at(-1), index: state.tracks.length - 1 };
    }

    globalThis.MusicBrainzApi = MusicBrainzApi;
    globalThis.TrackInfoParser = TrackInfoParser;
    globalThis.Helpers = Helpers;
    globalThis.Texture = Texture;
    globalThis.state = state;

    let update = () => {
        requestAnimationFrame(update);

        state.source = state.source;

        state.info = `State:${state.actx.state}; Paused:${state.source.paused}`
        // updateMetadata();
    };

    onMount(async () => {
        // nuiac.play();
        // changeTrack(0);
        update();
        await Helpers.sleep(1000);
        state.nuiac.init();
    });

    onDestroy(async () => {
        update = () => {};
        state.nuiac.pause();
        state.nuiac.removeAllListeners();
        await state.actx.destructor();
    });
</script>

<div id="container">
    <br /><br /><br />
    <br />
    <nobr>
        <input type='button' value='<<' disabled={state.index <= 0} on:click={() => nuiac.previoustrack()}>
        <input type='button' value={state.source.paused ? '|>' : '||'} on:click={() => nuiac.playOrPause()}>
        <input type='button' value='>>' disabled={state.index >= state.tracks.length - 1} on:click={() => nuiac.nexttrack()}>
    </nobr>
    <br />
    <nobr>
        <input type='number' step='any' value={state.source.currentTime >> 0} disabled={true} style="width: 40px">
        <input type='range' step='any' bind:value={state.source.currentTime} min={0} max={state.tracks[state.index]?.info.duration >> 0} style="width: 270px">
        <input type='number' step='any' value={state.tracks[state.index]?.info.duration >> 0} disabled={true} style="width: 40px">
    </nobr>
    Volume: <input type='range' step='any' bind:value={state.source.volume} min={0} max={1} style="width: 170px">
    <br />
    <input type='button' value='Context' on:click={() => state.actx.context.resume()}>
    <br />
    {state.info}
    <br />
    <!-- accept='audio/*' -->
    <input type='file' multiple  on:input={async e => {
        const files = [...e.target['files']];

        const fromTrackIndex = state.tracks.length;

        for (const file of files) {
            const buffer = await file.arrayBuffer();
            const offlineInfo = await TrackInfoParser.getOfflineFileTrackInfo(file.name, buffer);
            addTrack(buffer, offlineInfo, file.name, file.type);
        }

        for (let i = fromTrackIndex; i < state.tracks.length; ++i) {
            const track = state.tracks[i];
            track.info = await TrackInfoParser.tryGetOnlineFileTrackInfo(track.filename, track.buffer);
            updateTracks(i)
        }

        // await Helpers.Execution.forEachParallel(files, async file => {
        //     const buffer = await file.arrayBuffer();
        //     const offlineInfo = await TrackInfoParser.getOfflineFileTrackInfo(file.name, buffer);
        //     const track = addTrack(buffer, offlineInfo, file.name);
        //     const info = await TrackInfoParser.tryGetOnlineFileTrackInfo(file.name, buffer);
        //     track.track.info = info;
        //     updateTracks(track.index);
        // });
    }}>
    <br /><br /><br />
    <table>
        <thead>
            <tr>
                <th></th>
                <th>Cover</th>
                <th>Title</th>
                <th>Artists</th>
                <th>Albums</th>
                <th>Date</th>
                <th>Length</th>
            </tr>
        </thead>
        <tbody>
            {#each state.tracks as {info: track}, i}
            <tr class={i === state.index ? 'active' : ''} on:click={() => changeTrack(i)}>
                <td>{i}</td>
                <td><img src={TrackInfoParser.Parsed.getTrackCoverSrc(track)}></td>
                <td>{track.title}</td>
                <td>{track.artists?.map(a => a.name).join(', ')}</td>
                <td>{track.albums?.map(a => a.title).join(', ')}</td>
                <td><nobr>{Helpers.Date.getYYYYMMDDString(track.firstReleaseDate)}</nobr></td>
                <td>{formatDuration(track.duration)}</td>
            </tr>
            {/each}
        </tbody>
    </table>
</div>

<style>
    #container {
        display: grid;
        align-content: center;
        justify-content: center;
        align-items: center;
    }

    #container table img {
        height: 50px;
    }

    #container table tbody tr {
        cursor: pointer;
    }

    #container table tbody tr:hover {
        background: gray;
    }

    .active {
        background: lightgray;
    }
</style>
