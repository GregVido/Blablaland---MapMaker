let python = require('./python.js');

class OutputStream {
    constructor() {
        this.data = [];
        this.position = 0;
    }
    write(...args) {
        let count = python.len(args);
        if (count == 1) {
            if (typeof args[0] == typeof this.data) {
                for (let i = 0; i < python.len(args[0]); i++) this.data.push(args[0][i]);
                this.position += python.len(args[0]);
                return;
            } 
            if(typeof args[0] == typeof "") {
                for(let i = 0; i < python.len(args[0]); i++) {
                    this.data.push(python.ord(args[0][i]));
                }
                this.position += python.len(args[0]);
                return;
            }
            this.data.push(args[0])
            this.position++;
        }
    }
}

module.exports = OutputStream;