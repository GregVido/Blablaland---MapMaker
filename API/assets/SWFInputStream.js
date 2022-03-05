let displayRect = function() {
        this.Xmin = 0;
        this.Xmax = 0;
        this.Ymin = 0;
        this.Ymax = 0;
    },
    InputStream = require('./InputStream.js'),
    OutputStream = require('./OutputStream.js'),
    SWFOutputStream = require('./SWFOutputStream.js'),
    python = require('./python.js');;

class Tag {
    constructor(id, data) {
        this.forceWriteAsLong = false;
        this.id = id;
        this.data = data;
    }
    get length() {
        return python.len(this.data);
    }
    getId() {
        return this.id;
    }
    getData(version) {
        return this.data;
    }
    toString() {
        return "Tag id:" + this.id;
    }
    getOrigDataLength() {
        return python.len(data);
    }
}

class ABC {
    constructor(is) {
        let ais = new ABCInputStream(is),
            major_version = ais.readU16(),
            minor_version = ais.readU16(),
            constant_int_pool_count = ais.readU30(),
            constant_int = {};
        for (let i = 1; i < constant_int_pool_count; i++) { //index 0 not used. Values 1..n-1
            let val = ais.readS32();
            if (val == 1000000000) {
                val = 10;
            }
            constant_int[i] = val;
        }
        this.constant_int = constant_int;
        this.content = ais.content;
        this.major_version = major_version;
        this.minor_version = minor_version;
    }
    saveToStream(os) {
        let aos = new ABCOutputStream(os);
        aos.writeU16(this.major_version);
        aos.writeU16(this.minor_version);
        aos.writeU30(python.len(Object.keys(this.constant_int)));
        for (let i = 1; i < python.len(Object.keys(this.constant_int)); i++) {
            aos.writeS32(this.constant_int[i]);
        }
        aos.write(this.content);
        return aos.content;
    }
}

class DoABCTag extends Tag {
    constructor(data, version) {
        super(82, data);
        let is = new InputStream(data),
            sis = new SWFInputStream(is, version);
        this.flags = sis.readUI32();
        this.name = sis.readString();
        this.abc = new ABC(is);

    }
    getData(version) {
        let bos = new OutputStream(),
            os = bos,
            sos = new SWFOutputStream(os, version);
        sos.writeUI32(this.flags);
        sos.writeString(this.name);
        return this.abc.saveToStream(sos);
    }
}

class DefineBinayData extends Tag {
    constructor(data, version, input) {
        super(87, data);
        let is = new InputStream(data),
            sis = new SWFInputStream(is, version);
        this.tagId = sis.readUI16();
        this.reserved = sis.readUI32();
        this.input = input;

    }
    getData(version) {
        let os = new OutputStream(),
            sos = new SWFOutputStream(os, version);

        sos.writeUI16(this.tagId);
        sos.writeUI32(this.reserved);
        sos.writeString(this.input);

        return sos.content;
    }
}

class ABCOutputStream extends OutputStream {
    constructor(os) {
        super();
        this.os = os;
    }
    get content() {
        return this.os.os.data;
    }
    write(b) {
        this.os.write(b);
    }
    writeU16(value) {
        this.write(value & 0xff);
        this.write((value >> 8) & 0xff);
    }
    writeU30(value) {
        this.writeS32(value);
    }
    writeU32(value) {
        let loop = true;
        value = value & 0xFFFFFFFF
        do {
            let ret = (value & 0x7F);
            if (value < 0x80) {
                loop = false;
            }
            if (value > 0x7F) {
                ret += 0x80;
            }
            this.write(ret);
            value = value >> 7;
        } while (loop);
    }
    writeS32(value) {
        let belowZero = value < 0,
            bitcount = 0,
            loop = true;
        do {
            bitcount += 7;
            let ret = (value & 0x7F);
            if (value < 0x80) {
                if (belowZero) { //&& bitcount < 35
                    ret += 0x80;
                } else {
                    loop = false;
                }
            } else {
                ret += 0x80;
            }

            if (bitcount == 35) {
                ret = ret & 0xf;
            }
            this.write(ret);
            if (bitcount == 35) {
                break;
            }
            value = value >> 7;
        } while (loop);
    }
}

class ABCInputStream extends InputStream {
    constructor(is) {
        super();
        this.is = is;
        this.bytesRead = 0;
        this.bufferOs = null;
    }
    get content() {
        return this.is.content;
    }
    startBuffer() {
        bufferOs = new OutputStream();
    }
    stopBuffer() {
        if (bufferOs == null) return [0];
        ret = bufferOs.data();
        bufferOs = null;
        return ret;
    }
    read() {
        this.bytesRead++;
        let i = this.is.read();
        if (this.bufferOs != null) {
            if (i != -1) this.bufferOs.write(i);
        }
        return i;
    }
    readU8() {
        return this.read();
    }
    readU32() {
        let i = 0,
            ret = 0,
            bytePos = 0,
            byteCount = 0,
            nextByte = false;
        do {
            i = this.read();
            nextByte = (i >> 7) == 1;
            i = i & 0x7f;
            ret = ret + (i << bytePos);
            byteCount++;
            bytePos += 7;
        } while (nextByte);
        return ret;
    }
    readU30() {
        return this.readU32();
    }
    readS24() {
        let ret = (this.read()) + (this.read() << 8) + (this.read() << 16);
        if ((ret >> 23) == 1) ret = ret | 0xff000000;
        return ret;
    }
    readU16() {
        return (this.read()) + (this.read() << 8);
    }
    readS32() {
        let i = 0,
            ret = 0,
            bytePos = 0,
            byteCount = 0,
            nextByte = false;
        do {
            i = this.read();
            nextByte = (i >> 7) == 1;
            i = i & 0x7f;
            ret = ret + (i << bytePos);
            byteCount++;
            bytePos += 7;
            if (bytePos == 35) {
                if ((ret >> 31) == 1) ret = -(ret & 0x7fffffff);
                break;
            }
        } while (nextByte);
        return ret;
    }
    readLong() {
        let readBuffer = this.safeRead(8);
        return ((readBuffer[7] << 56) +
            ((readBuffer[6] & 255) << 48) +
            ((readBuffer[5] & 255) << 40) +
            ((readBuffer[4] & 255) << 32) +
            ((readBuffer[3] & 255) << 24) +
            ((readBuffer[2] & 255) << 16) +
            ((readBuffer[1] & 255) << 8) +
            ((readBuffer[0] & 255) << 0));
    }
    safeRead(count) {
        let ret = [];
        for (let i = 0; i < count; i++) {
            ret.push(this.read());
        }
        return ret;
    }
}

class SWFInputStream extends InputStream {
    constructor(is, version) {
        super();
        this.version = version;
        this.is = is;
        this.pos = 0;
        this.bitPos = 0;
        this.tempByte = 0;
    }
    getPos() {
        return this.pos;
    }
    read() {
        this.pos++;
        this.bitPos = 0;
        return this.is.read();
    }
    alignByte() {
        this.bitPos = 0;
    }
    readNoBitReset() {
        this.pos++;
        return this.read();
    }
    readUI8() {
        return this.read();
    }
    readUI16() {
        return this.read() + (this.read() << 8);
    }
    readUI32() {
        return (this.read() + (this.read() << 8) + (this.read() << 16) + (this.read() << 24)) & 0xffffffff;
    }
    readSI32() {
        let uval = this.read() + (this.read() << 8) + (this.read() << 16) + (this.read() << 24);
        if (uval >= 0x80000000) {
            return -(((~uval) & 0xffffffff) + 1);
        } else {
            return uval;
        }
    }
    readRECT() {
        let ret = new displayRect(),
            nBits = this.readUB(5);
        ret.Xmin = this.readSB(nBits);
        ret.Xmax = this.readSB(nBits);
        ret.Ymin = this.readSB(nBits);
        ret.Ymax = this.readSB(nBits);
        return ret;
    }
    readUB(nBits) {
        if (nBits == 0) return 0;
        let ret = 0;
        if (this.bitPos == 0) this.tempByte = this.readNoBitReset();
        for (let bit = 0; bit < nBits; bit++) {
            let nb = (this.tempByte >> (7 - this.bitPos)) & 1;
            ret = ret + (nb << (nBits - 1 - bit));
            this.bitPos++;
            if (this.bitPos == 8) {
                this.bitPos = 0;
                if (bit != nBits - 1) {
                    this.tempByte = this.readNoBitReset();
                }
            }
        }
        return ret;
    }
    readSB(nBits) {
        let uval = this.readUB(nBits);
        if ((uval & (1 << (nBits - 1))) > 0) uval |= (0xffffffff << nBits);
        return uval;
    }
    readBytes(count) {
        let ret = [];
        for (let i = 0; i < count; i++) ret.push(this.read());
        return ret;
    }
    readString() {
        let r = 0,
            baos = [];
        while (true) {
            r = this.read();
            if (r == 0) return Buffer.from(baos);
            baos.write(r);
        }
    }
    readTagList(input) {
        let tags = [],
            tag;
        while ((tag = this.readTag(input)) != null) {
            tags.push(tag);
        }
        return tags;
    }
    readTag(input) {
        let tagIDTagLength = this.readUI16(),
            tagID = (tagIDTagLength) >> 6;
        if (tagID == 0) return null;
        let tagLength = (tagIDTagLength & 0x003F),
            readLong = false;
        if (tagLength == 0x3f) {
            tagLength = this.readSI32();
            readLong = true;
        }
        let data = this.readBytes(tagLength),
            ret = new Tag(tagID, data);
        if (tagID == 87) {
            ret = new DefineBinayData(data, this.version, input);
        }
        ret.forceWriteAsLong = readLong;
        return ret;
    }
}

module.exports = SWFInputStream;