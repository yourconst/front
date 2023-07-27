import { Helpers } from "../../helpers/common";

export namespace IMusicBrainz {
    export type ID = string;

    export interface Artist {
        id: ID;
        name: string;
        'sort-name': string;
        disambiguation: string;
    }

    export interface ArtistCredit {
        artist: Artist;
        name: string;
        joinphrase?: string;
    }

    export interface Track {
        id: ID;
        title: string;
        /** milliseconds */
        length: number;
        number: `${number}`;
    }

    export interface Media {
        position: number;
        'track-count': number;
        'track-offset': number;
        track: Track[];
    }

    export interface ReleaseGroup {
        id: ID;
        title: string;
        'type-id': ID;
        'primary-type': 'Album' | 'Single' | null; // ...
        'primary-type-id': ID;
    }

    export interface Release {
        id: ID;
        title: string;
        'track-count': number;
        count: number;
        'artist-credit'?: ArtistCredit[];
        'release-group': ReleaseGroup;
        media: Media[];
    }

    export interface Recording {
        id: ID;
        title: string;
        /** milliseconds */
        length: number;
        /** YYYY-MM-DD */
        'first-release-date': string;
        'artist-credit': ArtistCredit[];
        score: number;
        video?: any;
        releases?: Release[];
    }

    export interface RecordingResponse {
        count: number;
        /** ISO date */
        created: string;
        offset: number;
        recordings?: Recording[];
    }
}

export namespace ICoverArtArchive {
    export type ID = number;

    export interface Image {
        id: ID;
        approved: boolean;
        front: boolean;
        back: boolean;
        comment: string;
        edit: number;
        types: ('Front' | 'Back')[];
        image: string;
        thumbnails?: {
            small?: string;
            large?: string;
            [key: number]: string;
        };
    }

    export interface CoverResponse {
        /** release url on musicbrainz */
        release: string;
        images: Image[];
    }
}

export class MusicBrainzApi {
    static readonly mbFetcher = new Helpers.Fetch.PeriodLimiter({ periodSize: 10 * 1000, periodMaxTaskCount: 10, errors: { sleepTime: 3000 } });
    static readonly caaFetcher = new Helpers.Fetch.PeriodLimiter({ periodSize: 10 * 1000, periodMaxTaskCount: 10, errors: { sleepTime: 3000 } });

    static async findRecording(i: { title: string, artist?: string }): Promise<IMusicBrainz.RecordingResponse> {
        let query: string;

        if (i.artist) {
            query = `artistname:'${i.artist}' AND recordingname:'${i.title}'`;
        } else {
            query = `'${i.title}'`;
        }

        const res = await this.mbFetcher.fetch(
            encodeURI(`http://musicbrainz.org/ws/2/recording?query=${query}&limit=3&fmt=json`),
            undefined,
            {
                noThrow: true,
            },
        );

        if (!Helpers.Fetch.isResponseSuccess(res)) {
            return null;
        }

        return res.json();
    }

    static async loadReleaseCover(releaseId: IMusicBrainz.ID): Promise<ICoverArtArchive.CoverResponse> {
        const res = await this.caaFetcher.fetch(
            `http://coverartarchive.org/release/${releaseId}`,
            undefined,
            {
                noThrow: true,
            },
        );

        if (!Helpers.Fetch.isResponseSuccess(res)) {
            return null;
        }

        return res.json();
    }
}
