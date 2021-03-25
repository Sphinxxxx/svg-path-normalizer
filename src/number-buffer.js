//Rules for our number tokenizer
//https://developer.mozilla.org/en-US/docs/Web/SVG/Content_type#Number
//
//  number ::= integer ([Ee] integer)?
//         | [+-]? [0-9]* "." [0-9]+ ([Ee] integer)?
//
const NUMSTATE_INIT = 1,
    NUMSTATE_WHOLE = 2,
    NUMSTATE_DECIMAL = 3,
    NUMSTATE_EXP = 4,
    NUMSTATE_EXPWHOLE = 5;
//Decimal aren't allowed in the `e` operator (e.g. "1e3.2"),
//or else we'd need another NUMSTATE_EXPDECIMAL state.

const NUMTOKEN_SIGN = 1,
    NUMTOKEN_DIGIT = 2,
    NUMTOKEN_DECIMAL = 3,
    NUMTOKEN_EXP = 4;

//Given a number buffer's state and the next input token, find the next state:
const NUM_NEXTSTATE = { "1": { "1": 2, "2": 2, "3": 3, "4": 4 }, "2": { "2": 2, "3": 3, "4": 4 }, "3": { "2": 3, "4": 4 }, "4": { "1": 5, "2": 5 }, "5": { "2": 5 } };
/* If the NUMXXX constants change, here's how to generate the NUM_NEXTSTATE object:
function createObject(entries){
    const obj = {};
    entries.forEach(([key, val]) => {
        obj[key] = val;
    });
    return obj;
}
const NUM_NEXTSTATE = createObject([
    [NUMSTATE_INIT, createObject([
        [NUMTOKEN_SIGN,    NUMSTATE_WHOLE],
        [NUMTOKEN_DIGIT,   NUMSTATE_WHOLE],
        [NUMTOKEN_DECIMAL, NUMSTATE_DECIMAL],
        //Beginning a number with the `e` operator is actually invalid (e.g. "e2" is not a valid representation of 100).
        //But this is only a normalizer, not a parser, so push it through..
        [NUMTOKEN_EXP,     NUMSTATE_EXP],
    ])],
    [NUMSTATE_WHOLE, createObject([
        [NUMTOKEN_DIGIT,   NUMSTATE_WHOLE],
        [NUMTOKEN_DECIMAL, NUMSTATE_DECIMAL],
        [NUMTOKEN_EXP,     NUMSTATE_EXP],
    ])],
    [NUMSTATE_DECIMAL, createObject([
        [NUMTOKEN_DIGIT,   NUMSTATE_DECIMAL],
        [NUMTOKEN_EXP,     NUMSTATE_EXP],
    ])],
    [NUMSTATE_EXP, createObject([
        [NUMTOKEN_SIGN,    NUMSTATE_EXPWHOLE],
        [NUMTOKEN_DIGIT,   NUMSTATE_EXPWHOLE],
    ])],
    [NUMSTATE_EXPWHOLE, createObject([
        [NUMTOKEN_DIGIT,   NUMSTATE_EXPWHOLE],
    ])],
]);
console.log(JSON.stringify(NUM_NEXTSTATE));
//*/

function numToken(ch) {
    switch (ch) {
        case '-':
        case '+':
            return NUMTOKEN_SIGN;
        case '.':
            return NUMTOKEN_DECIMAL;
        case 'e':
        case 'E':
            return NUMTOKEN_EXP;
        default:
            return (/\d/).test(ch) ? NUMTOKEN_DIGIT : null;
    }
}


class NumberBuffer {
    constructor() {
        this.state = NUMSTATE_INIT;
        this.consumed = '';
    }

    accept(ch) {
        const token = numToken(ch);
        if (!token) { return false; }

        const nextState = NUM_NEXTSTATE[this.state][token];
        if (nextState) {
            this.state = nextState;
            this.consumed += ch;
            return true;
        }
        return false;
    }

    isValid() {
        //A number can't begin with the `e` operator,
        //and all valid numbers end with a digit(?)
        //Other invalid variants won't make it through our state machine:
        const num = this.consumed;
        return (num.length && (/^[^eE]/).test(num) && (/\d$/).test(num));
    }

    /* Not needed in this project, nor treeshaked by rollup..
    reset() {
        this.state = NUMSTATE_INIT;
        this.consumed = '';
    }

    flush() {
        const buf = this.consumed;
        this.reset();
        return buf;
    }
    */

    static readFrom(stringStream) {
        const buffer = new NumberBuffer();
        let ch;
        while (ch = stringStream.peek()) {
            if (buffer.accept(ch)) {
                stringStream.skip();
            }
            else {
                break;
            }
        }
        return buffer.consumed ? buffer : null;
    }
}


export default NumberBuffer;
