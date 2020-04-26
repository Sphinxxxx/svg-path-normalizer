import NumBuf from "./number-buffer";
import Stream from "./string-stream";


class Segment {
    constructor(command) {
        this.command = command || '';
        this.params = [];
    }

    hasContent() {
        return (this.command || this.params.length);
    }

    addParam(p) {
        this.params.push(p);
    }

    expectArcFlag() {
        //The "large" and "sweep" flags are single values (0 or 1) which don't have to be separated from nearby numbers.
        //For example, these are all the same valid arc path segment:
        //
        //  a60,60 0 1,1 99,11
        //  a60,60 0 11 99,11
        //  a60,60 0 1 199,11
        //  a60,60 0 1199,11
        //
        if ((/[Aa]/).test(this.command)) {
            const len = this.params.length % 7;
            return (len === 3) || (len === 4);
        }
    }
}

function normalize(path, returnArray) {
    const pathStream = new Stream(path),
        norm = [];
    let segment = new Segment();

    function isCommand(ch) {
        ch = ch.toLowerCase();
        //Number exponent:
        if (ch === 'e') { return false; }

        return (/[a-z]/).test(ch);
    }

    function pushSegment() {
        if (segment.hasContent()) {
            norm.push(segment);
        }
    }

    let ch, num;
    while (ch = pathStream.peek()) {
        if (isCommand(ch)) {
            pushSegment();
            segment = new Segment(ch);
            pathStream.skip();
        }
        else if (num = NumBuf.readFrom(pathStream)) {
            //Special handling of arc flags (see comment in `expectArcFlag()`):
            while (segment.expectArcFlag() && (/[01]/).test(num[0])) {
                segment.addParam(num[0]);
                num = num.substring(1);
            }
            if (num) {
                segment.addParam(num);
            }
        }
        else {
            //Presumably a comma or whitespace. Ignore.
            pathStream.skip();
        }
    }
    pushSegment();


    const array = norm.map(x => [x.command, x.params]),
        result = returnArray
        ? array
        : ('' + array).replace(/,/g, ' ').trim();
    return result;
}


export default normalize;
