const errors = new Map;

function addErrorName(rightName) {
    Array.from(arguments).slice(1).forEach(name => errors.set(name.toUpperCase(), rightName));
}

//addErrorName(["TOMM¥ €A$H"], "tommy cash", "tomm ah");
addErrorName(["TOMMY CASH"], "tommy cash", "tomm ah");
addErrorName(["$uicideboy$"], "uicideboy");
addErrorName(["M.I.A."], "mia", "m.i.a");
addErrorName(["P!nk"], "pnk", "pink");
addErrorName(["TroyBoi"], "troiboi", "troiboy", "troyboi");
addErrorName(["SID", "RAM"], "sidram", "sidxram");
addErrorName(["Пика", "PIKA"], "pikaпика", "пикаpika");
addErrorName(["PHARAOH"], "pharaon", "фараон");

function checkErrorName(name) {
    const rightNames = errors.get(name.trim().toUpperCase());
    let res;

    if(rightNames)
    res = rightNames;
    else
        res = [name.replace(/(^|\s)(aap|asap)(\s|$)/i, " A$AP ").trim()];

    return res;
}

function trackInfo(filename, title, artist, album, year) {
    let artists = [], origin = {title, artist, album, year, filename},
        woext = (
            filename
            .substr(0, filename.lastIndexOf('.'))
            .replace(/(\s{2,})/ig, ' ')
            .trim()
        ),
        fline = woext.replace("-amp-", '&').split(/^([^-]+)-/).slice(1);

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
        artist = fline.length > 1 ? fline[0] : "Unknown";
        
    let prdRmxFt = title.replace('[', '(').replace(']', ')')//?([^#(-]*)
        .split(new RegExp("(?: |(?:[(]([^(]*)))(?:prod by.|prod by |prod. by|prod.by.|prod.by|prod |prod.|feat |feat.|ft |ft.|remix|remix by )([^)(]*)[$) ]?", "i"))
        .filter(a => a);

    //title = prdRmxFt[0].trim();
    console.log()
    artist = artist.replace(
        /[A-Z]+x[A-Z]+/g,
            x => x.replace(
                /[A-Z]x[A-Z]/g, y => y.replace('x', '&')
            )
        );
                       //"/|([A-Z]*)x([A-Z]*)|"
    let arexp = new RegExp("&|,|;|/|-amp-| and | x |[ (](?:feat |feat.|ft |ft.)[) ]", 'i'),
        ats = (artist.split(arexp));

    prdRmxFt.slice(1).forEach(a => ats.push.apply(ats, a.split(arexp)));

    ats.forEach(a => {
        if(a) {
            let art = a.replace(/\(.*\)|\(|\)/g,"").trim();

            if(art.length) {
                artists.push.apply(artists,
                    checkErrorName(
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

    if(!year)
        year = title.split(/(?:\D|^)(\d{4})(?:\D|$)/g, 2)[1] || "0";
        
    return {
        title, origin,
        year: parseInt(year),
        artists: artists.map(a => ({artist: a})),
        albums: [{album: album, date: year}]
    };
}

if(typeof module != 'undefined') {
    module.exports = trackInfo;
}