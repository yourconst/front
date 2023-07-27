import type { IID3Tag } from "id3-parser/lib/interface";
import { MusicBrainzApi, type ICoverArtArchive, type IMusicBrainz } from "../../api/musicbrainz";
import { Helpers } from "../../helpers/common";
import * as ID3 from 'id3-parser';
import { emptyCoverSrc } from "./emptyCover";

export namespace ITrackInfo {
    export type MBID = IMusicBrainz.ID;
    export type CAAID = ICoverArtArchive.ID;

    export interface Artist {
        mbid?: MBID;
        name: string;
        description?: string;
    }

    export interface Image {
        caaid?: CAAID;
        src: string;
        comment?: string;
        thumbnails?: ICoverArtArchive.Image['thumbnails'];
    }

    export interface Cover {
        front: Image;
        back?: Image;
    }

    export interface Album {
        mbid?: MBID;
        title: string;
        // artists?: Artist[];
        type?: IMusicBrainz.ReleaseGroup['primary-type'];
        date?: Date;
        cover?: Cover;
    }

    export type ID3Parsed = Awaited<ReturnType<typeof ID3Parser['parse']>>;

    export interface Track {
        mbid?: MBID;
        title: string;
        /** milliseconds */
        duration?: number;
        firstReleaseDate?: Date;

        artists?: Artist[];
        albums?: Album[];
        _id3?: ID3Parsed;
    }
}


export class MusicBrainzParser {
    static parseCover(response: ICoverArtArchive.CoverResponse): ITrackInfo.Cover {
        if (!response?.images) {
            return null;
        }

        const front = response.images.find(i => i.front);
        const back = response.images.find(i => i.back);

        return {
            front: front ? {
                caaid: front.id,
                src: front.image,
                comment: front.comment,
                thumbnails: front.thumbnails,
            } : null,
            back: back ? {
                caaid: back?.id,
                src: back?.image,
                comment: back?.comment,
                thumbnails: back?.thumbnails,
            } : null,
        };
    }

    static parseArtist(artistCredit: IMusicBrainz.ArtistCredit): ITrackInfo.Artist {
        return {
            mbid: artistCredit.artist.id,
            name: artistCredit.artist.name || artistCredit.name || artistCredit.artist["sort-name"],
            description: artistCredit.artist.disambiguation,
        };
    }

    static async parseAlbum(release: IMusicBrainz.Release): Promise<ITrackInfo.Album> {
        const coverResponse = await MusicBrainzApi.loadReleaseCover(release.id);

        return {
            mbid: release.id/*  || release["release-group"].id */,
            title: release.title/*  || release['release-group'].title */,
            type: release["release-group"]["primary-type"],
            cover: this.parseCover(coverResponse),
        };
    }

    static async parseTrack(recording: IMusicBrainz.Recording): Promise<ITrackInfo.Track> {
        return {
            mbid: recording.id,
            title: recording.title,
            duration: (recording.length / 1000) || null,
            firstReleaseDate: Helpers.Date.fromYYYYMMDD(recording["first-release-date"]),
            artists: recording["artist-credit"]?.map(ac => this.parseArtist(ac)),
            albums: await Promise.all(recording.releases?.map(a => this.parseAlbum(a)) || []),
        };
    }

    static async tryLoadTrackInfo(info: Parameters<typeof MusicBrainzApi['findRecording']>[0]) {
        const response = await MusicBrainzApi.findRecording(info);

        if (!response?.recordings?.length) {
            return null;
        }
        
        return this.parseTrack(response.recordings[0]);
    }
}

export class ID3Parser {
    static async parseCover(raw?: IID3Tag): Promise<ITrackInfo.Cover> {
        const id3image = raw?.image;
        
        if (id3image?.data) {
            return {
                front: {
                    src: await Helpers.ArrayBuffer.toDataUrl(new Uint8Array(id3image.data).buffer, id3image.mime),
                    comment: id3image.descriptions,
                },
            };
        }

        return null;
    }

    static parseBase(buffer: ArrayBuffer) {
        const raw = ID3.parse(new Uint8Array(buffer));

        if (!raw) {
            return null;
        }

        return {
            title: raw.title || raw['title-sort'],
            length: raw.length,
            date: raw['release-time'] || raw['original-release-time'] || raw['year'],
            artist: raw.artist || raw['original-artist'],
            album: raw.album || raw['album-sort'],
            raw,
        };
    }

    static async parse(buffer: ArrayBuffer) {
        const base = ID3Parser.parseBase(buffer);
        const cover = await ID3Parser.parseCover(base?.raw);

        return {
            ...base,
            cover,
        };
    }
}

export class TrackInfoParsedParser {
    static getSmallestImageSrc(image: ITrackInfo.Image) {
        return image?.thumbnails?.small || image?.src;
    }
    static getTrackCoverImage(track: ITrackInfo.Track) {
        return track.albums?.find(a => a.cover)?.cover?.front || track._id3?.cover?.front;
    }
    static getTrackCoverSrc(track: ITrackInfo.Track) {
        return TrackInfoParsedParser.getSmallestImageSrc(
            TrackInfoParsedParser.getTrackCoverImage(track),
        ) || emptyCoverSrc;
    }

    static getTrackArtworkMediaImage(track: ITrackInfo.Track): MediaImage[] {
        const image = TrackInfoParsedParser.getTrackCoverImage(track);

        if (!image) {
            return [];
        }

        return [
            ...Object.entries(image.thumbnails || {}).map(([sz, src]) => {
                if (sz === 'small') {
                    sz = '128';
                } else if (sz === 'large') {
                    sz = '512';
                }
                return { src, sizes: `${sz}x${sz}`, type: `image/jpeg` };
            }),
            { src: image.src, sizes: `${512}x${512}`, type: `image/jpeg` },
        ];

        // const BASE_URL = 'https://storage.googleapis.com/media-session/';
        // [
        //     // { src: BASE_URL + 'sintel/artwork-96.png',  sizes: '96x96',   type: 'image/png' },
        //     // { src: BASE_URL + 'sintel/artwork-128.png', sizes: '128x128', type: 'image/png' },
        //     // { src: BASE_URL + 'sintel/artwork-192.png', sizes: '192x192', type: 'image/png' },
        //     { src: BASE_URL + 'sintel/artwork-256.png', sizes: '256x256', type: 'image/png' },
        //     { src: BASE_URL + 'sintel/artwork-384.png', sizes: '384x384', type: 'image/png' },
        //     { src: BASE_URL + 'sintel/artwork-512.png', sizes: '512x512', type: 'image/png' },
        // ],
    }
    
    static getTrackDuration(track?: ITrackInfo.Track, decodedDuration?: number) {
        if (!track) {
            return decodedDuration;
        }
        if (!track.duration || track.duration < decodedDuration) {
            track.duration = decodedDuration;
        }
        return track.duration;
    }
}

export class TrackInfoParser {
    static readonly Parsed = TrackInfoParsedParser;
    static readonly ID3 = ID3Parser;

    static wrongNames = new Map<string, string[]>();

    static fixWrongArtist(rightName: string | string[], ...wrongNames: string[]) {
        const rns = Array.isArray(rightName) ? rightName : [rightName];
        
        for (const wn of wrongNames) {
            this.wrongNames.set(wn.toUpperCase(), rns);
        }
    }

    static getRightArtist(name: string) {
        const rightNames = this.wrongNames.get(name.trim().toUpperCase());

        if (rightNames) {
            return rightNames;
        } else {
            return [name.replace(/(^|\s)(aap|asap)(\s|$)/i, " A$AP ").trim()];
        }
    }

    static getOfflineTrackInfo({title, artist, album, date, length, filename}: {
        filename: string;
        title?: string;
        artist?: string;
        album?: string;
        date?: string;
        length?: number | string;
    }): ITrackInfo.Track {
        title = title?.replaceAll('\x00', ' ').replaceAll(/\s{2,}/ig, ' ');
        artist = artist?.replaceAll('\x00', ' ').replaceAll(/\s{2,}/ig, ' ');
        album = album?.replaceAll('\x00', ' ').replaceAll(/\s{2,}/ig, ' ');
        filename = filename?.replaceAll('\x00', ' ').replaceAll(/\s{2,}/ig, ' ');

        let artists: string[] = [];
        const woext = filename
            .slice(0, filename.lastIndexOf('.'))
            .replace(/(\s{2,})/ig, ' ')
            .trim();
        const fline = woext.replace("-amp-", '&').split(/^([^-]+)-/).slice(1);

        if(title) {
            let firstSepInd = title.indexOf(" - ");
            if(
                firstSepInd > 0 &&
                (title.indexOf("(") == -1 || title.indexOf("(") > firstSepInd)
            ) {
                let m = title.split(/^([^-]+)-/).slice(1);
    
                artist = artist ? `${m[0]} & ${artist}` : m[0];
                title = m[1];
            }
        }
    
        if(!title)
            title = fline.length > 1 ? fline[1] : woext;
            
        title = title.trim();

        if(!artist)
            artist = fline.length > 1 ? fline[0] : 'Unknown';
        
        const prdRmxFt = title.replace('[', '(').replace(']', ')')//?([^#(-]*)
            .split(new RegExp("(?: |(?:[(]([^(]*)))(?:prod by.|prod by |prod. by|prod.by.|prod.by|prod |prod.|feat |feat.|ft |ft.|remix|remix by )([^)(]*)[$) ]?", "i"))
            .filter(a => a);
        
        artist = artist.replace(
            /[A-Z]+x[A-Z]+/g,
            x => x.replace(
                /[A-Z]x[A-Z]/g, y => y.replace('x', '&')
            ),
        );

        const arexp = new RegExp("&|,|;|/|-amp-| and | x |[ (](?:feat |feat.|ft |ft.)[) ]", 'i');
        const ats = artist.split(arexp);

        prdRmxFt.slice(1).forEach(a => ats.push.apply(ats, a.split(arexp)));
        
        ats.forEach(a => {
            if(a) {
                let art = a.replace(/\(.*\)|\(|\)/g,"").trim();
    
                if(art.length) {
                    artists.push.apply(artists,
                        this.getRightArtist(
                            art.replace(/(^|\s)[а-яёa-z]/g, function(x){return x.toUpperCase();})
                        )
                    );
                }
            }
        });
    
        artists = Array.from(new Set(artists));

        if(!album)
            album = "Unknown";
    
        album = album.replace(/(\s{2,})/ig, ' ');
    
        if(!date)
            date = title.split(/(?:\D|^)(\d{4})(?:\D|$)/g, 2)[1] || "0";
        
        return {
            title,
            duration: (+length / 1000) || null,
            firstReleaseDate: date ? Helpers.Date.fromYYYYMMDD(String(date)) : null,
            artists: artists.map(name => ({ name })),
            albums: [{ title: album }],
        };
    }

    static async tryGetOnlineTrackInfo(options: Parameters<typeof TrackInfoParser['getOfflineTrackInfo']>[0]) {
        const offlineInfo = this.getOfflineTrackInfo(options);
        const onlineInfo = await MusicBrainzParser.tryLoadTrackInfo({
            title: offlineInfo.title,
            artist: offlineInfo.artists.map(a => a.name).join(', '),
        });

        if (onlineInfo) {
            return onlineInfo;
        }
        return offlineInfo;
    }

    static async getOfflineFileTrackInfo(filename: string, buffer: ArrayBuffer, id3?: ITrackInfo.ID3Parsed) {
        id3 ??= await ID3Parser.parse(buffer);

        if (!id3) {
            return this.getOfflineTrackInfo({ filename });
        }

        const info = this.getOfflineTrackInfo({
            filename,
            title: id3.title,
            length: id3.length,
            date: id3.date,
            artist: id3.artist,
            album: id3.album,
        });

        info._id3 = id3;

        return info;
    }

    static async tryGetOnlineFileTrackInfo(filename: string, buffer: ArrayBuffer, id3?: ITrackInfo.ID3Parsed) {
        id3 ??= await ID3Parser.parse(buffer);

        if (!id3) {
            return this.getOfflineTrackInfo({ filename });
        }

        const info = await this.tryGetOnlineTrackInfo({
            filename,
            title: id3.title,
            length: id3.length,
            date: id3.date,
            artist: id3.artist,
            album: id3.album,
        });

        info._id3 = id3;

        return info;
    }
}

//TrackInfoParser.fixWrongArtist(["TOMM¥ €A$H"], "tommy cash", "tomm ah");
TrackInfoParser.fixWrongArtist(["TOMMY CASH"], "tommy cash", "tomm ah");
TrackInfoParser.fixWrongArtist(["$uicideboy$"], "uicideboy");
TrackInfoParser.fixWrongArtist(["M.I.A."], "mia", "m.i.a");
TrackInfoParser.fixWrongArtist(["P!nk"], "pnk", "pink");
TrackInfoParser.fixWrongArtist(["TroyBoi"], "troiboi", "troiboy", "troyboi");
TrackInfoParser.fixWrongArtist(["SID", "RAM"], "sidram", "sidxram");
TrackInfoParser.fixWrongArtist(["Пика", "PIKA"], "pikaпика", "пикаpika");
TrackInfoParser.fixWrongArtist(["PHARAOH"], "pharaon", "фараон");
