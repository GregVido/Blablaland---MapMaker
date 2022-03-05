let python = require('./python.js');

class InputStream {
    constructor(data) {
        this.data = data;
        this.position = 0;
    }
    get content() {
        return this.data.slice(this.position);
    }
    read(...args) {
        let count = python.len(args);
        if (!count) {
            this.position++;
            return this.data[this.position - 1];
        } else if (count == 1) {
            let buffer = this.data.slice(this.position, args[0] + this.position);
            this.position += args[0];
            return buffer;
        } else if (count == 3) {
            let buffer = this.data.slice(args[1], args[2]);
            this.position += args[0];
            return buffer;
        }
    }
    reset() {
        this.position = 0;
    }
    available() {
        return this.position > python.len(this.data) ? true : false;
    }
}

module.exports = InputStream;