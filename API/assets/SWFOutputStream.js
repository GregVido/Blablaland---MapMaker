let python = require('./python.js');

class SWFOutputStream {
    constructor(os, version) {
        this.os = os;
        this.version = version;
        this.bitPos = 0;
        this.tempByte = 0;
        this.pos = 0;
    }
    get content() {
        return this.os.data;
    }
    write(b) {
        this.alignByte();
        this.os.write(b);
        this.pos++;
    }
    alignByte() {
        if (this.bitPos > 0) {
            this.bitPos = 0;
            this.write(this.tempByte);
            this.tempByte = 0;
        }
    }
    writeString(v) {
        this.write(v);
        this.write(0);
    }
    writeUI8(val) {
        this.write(val);
    }
    writeUI32(value) {
        this.write((value & 0xff));
        this.write(((value >> 8) & 0xff));
        this.write(((value >> 16) & 0xff));
        this.write(((value >> 24) & 0xff));
    }
    writeUI16(value) {
        this.write((value & 0xff));
        this.write(((value >> 8) & 0xff));
    }
    writeSI32(value) {
        this.writeUI32(value);
    }
    writeSI16(value) {
        this.writeUI16(value);
    }
    writeSI8(value) {
        this.writeUI8(value);
    }
    writeFIXED(value) {
        let valueLong = (value * (1 << 16)),
            beforePoint = valueLong >> 16,
            afterPoint = valueLong % (1 << 16);
        this.writeUI16(afterPoint);
        this.writeUI16(beforePoint);
    }
    writeUB(nBits, value) {
        for (let bit = 0; bit < nBits; bit++) {
            let nb = ((value >> (nBits - 1 - bit)) & 1);
            this.tempByte += nb * (1 << (7 - this.bitPos));
            this.bitPos++;
            if (this.bitPos == 8) {
                this.bitPos = 0;
                this.write(this.tempByte);
                this.tempByte = 0;
            }
        }
    }
    writeSB(nBits, value) {
        this.writeUB(nBits, value);
    }
    writeLong(value) {
        let writeBuffer = {};
        writeBuffer[3] = (value >>> 56);
        writeBuffer[2] = (value >>> 48);
        writeBuffer[1] = (value >>> 40);
        writeBuffer[0] = (value >>> 32);
        writeBuffer[7] = (value >>> 24);
        writeBuffer[6] = (value >>> 16);
        writeBuffer[5] = (value >>> 8);
        writeBuffer[4] = (value >>> 0);
        this.write(writeBuffer);
    }
    getNeededBitsS(v) {
        let n = 33,
            m = 0x80000000;
        if ((v & m) == m) {
            if (v == 0xffffffff) n = 1;
            else
                while ((v & m) == m) {
                    n--;
                    m >>= 1;
                }
        } else {
            if (v == 0x00000000) n = 1;
            else
                while ((v & m) == 0) {
                    n--;
                    m >>= 1;
                }
        }
        return n;
    }
    getNeededBitsF(value) {
        if (value == -1) return 18;
        let val = (value * (1 << 16));
        return this.getNeededBitsS(val);
    }
    enlargeBitCountS(currentBitCount, value) {
        let neededNew = this.getNeededBitsS(value);
        if (neededNew > currentBitCount) return neededNew;
        return currentBitCount;
    }
    writeRECT(value) {
        let nBits = 0;
        nBits = this.enlargeBitCountS(nBits, value.Xmin);
        nBits = this.enlargeBitCountS(nBits, value.Xmax);
        nBits = this.enlargeBitCountS(nBits, value.Ymin);
        nBits = this.enlargeBitCountS(nBits, value.Ymax);

        this.writeUB(5, nBits);
        this.writeSB(nBits, value.Xmin);
        this.writeSB(nBits, value.Xmax);
        this.writeSB(nBits, value.Ymin);
        this.writeSB(nBits, value.Ymax);
    }
    writeTags(tags) {
        for (let i = 0; i < python.len(tags); i++) {
            this.writeTag(tags[i]);
        }
    }
    writeTag(tag, version) {
        let data = tag.getData(version),
            tagLength = data.length,
            tagID = tag.getId(),
            tagIDLength = (tagID << 6);
        if ((tagLength < 0x3f) && (!tag.forceWriteAsLong)) {
            tagIDLength += tagLength;
            this.writeUI16(tagIDLength);
        } else {
            tagIDLength += 0x3f;
            this.writeUI16(tagIDLength);
            this.writeSI32(tagLength);
        }
        this.write(data);
    }
}

module.exports = SWFOutputStream;