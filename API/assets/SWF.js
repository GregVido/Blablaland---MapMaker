let python = require('./python.js'),
    InputStream = require('./InputStream.js'),
    OutputStream = require('./OutputStream.js'),
    SWFOutputStream = require('./SWFOutputStream.js'),
    SWFInputStream = require('./SWFInputStream.js'),
    fs = require('fs'),
    zlib = require("zlib");

class SWF {
    constructor(is, input) {
        this.compressed = false;
        let signature = is.read(3),
            shdr = python.str(signature);
        if (shdr !== "CWS" && shdr !== "FWS") return console.log("Invalid SWF file");
        let version = is.read(),
            sis = new SWFInputStream(is, version),
            fileSize = sis.readUI32();
        this.version = version;
        if (shdr[0] == 'C') {
            sis = new SWFInputStream(new InputStream(zlib.inflateSync(is.content)), version);
            this.compressed = true;
        }
        let rect = sis.readRECT();
        this.displayRect = rect;
        sis.readUI8();
        let frameRate = sis.readUI8(),
            frameCount = sis.readUI16(),
            tags = sis.readTagList(input);
        this.frameRate = frameRate;
        this.frameCount = frameCount;
        this.tags = tags;
    }
    saveTo(os, name) {
        let sos = new SWFOutputStream(new OutputStream(), this.version);
        sos.writeRECT(this.displayRect);
        sos.writeUI8(0);
        sos.writeUI8(this.frameRate);
        sos.writeUI16(this.frameCount);
        sos.writeTags(this.tags, this.version);
        sos.writeUI16(0);
        let data = sos.content;
        if (this.compressed) {
            os.write('C');
        } else {
            os.write('F');
        }
        os.write('W');
        os.write('S');
        os.write(this.version);
        sos = new SWFOutputStream(os, this.version);
        sos.writeUI32(python.len(data) + 8);
        if (this.compressed) data = zlib.deflateSync(Buffer.from(data));
        os.write(data);
        fs.writeFileSync(name, Buffer.from(os.data));
    }
}

module.exports = SWF;