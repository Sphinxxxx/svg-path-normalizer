class StringStream {
    constructor(str) {
        this.string = str;
        this.position = 0;
    }

    peek() {
        return this.string[this.position];
    }

    skip() {
        this.position++;
    }
}


export default StringStream;
