const execSync = require('child_process').execSync;
const SocketIOFile = require('socket.io-file');
const replace = require('buffer-replace');
const zlib = require('zlib');
const path = require('path');
const fs = require('fs');

let base = fs.readFileSync('./API/ressources/Map.as').toString();
let caches = [];

let SWF = require('./assets/SWF.js'),
    InputStream = require('./assets/InputStream.js'),
    OutputStream = require('./assets/OutputStream.js');

class API {

    constructor(params) {
        this.express = require('express');
        this.app = this.express();
        this.server = require('http').createServer(this.app);
        this.io = require('socket.io')(this.server);
        this.port = params.PORT || 8080;
        this.core = params.CORE;

        setInterval(this.clearCache.bind(this), 10 * 60 * 1000);
    }

    clearCache() {
        for (let i = 0; i < caches.length; i++) {
            let file = caches[i];

            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
        }

        caches = [];
    }

    init() {
        this.app.get('/socket.io-file-client.js', (req, res, next) => {
            return res.sendFile(path.join(__dirname, '../node_modules/socket.io-file-client/socket.io-file-client.js'));
        });

        this.app.use(this.express.static('./API/htdocs'));

        this.io.on('connection', this.socket.bind(this));

        this.server.listen(this.port, function() {
            console.log('-> API:\tOK!');
        });
    }

    socket(socket) {
        socket['create'] = false;
        socket['params'] = {};
        socket['params'].left = 167;
        socket['params'].right = 172;
        socket['params'].top = 69;
        socket['params'].bottom = 9;

        socket['params'].porte = 9;
        socket['params'].x = 950 / 2;
        socket['params'].y = 425 / 2;

        socket['params'].audio = '';

        let print = (text) => {
            socket.emit('log', text);
        }

        let createSWF = () => {

            let map = base;
            let params = socket['params'];

            if (params.left != undefined) {
                map = map.replace(/443/g, params.left);
            }

            if (params.right != undefined) {
                map = map.replace(/444/g, params.right);
            }

            if (params.top != undefined) {
                map = map.replace(/445/g, params.top);
            }

            if (params.bottom != undefined) {
                map = map.replace(/446/g, params.bottom);
            }

            if (params.porte != undefined) {
                map = map.replace(/1001/g, params.porte);
            }

            if (params.x != undefined) {
                map = map.replace(/885/g, params.x);
            }

            if (params.y != undefined) {
                map = map.replace(/394/g, params.y);
            }

            if (params.y != undefined) {
                map = map.replace(/394/g, params.y);
            }

            if (params.audio != undefined) {
                map = map.replace(/test.mp3/g, params.audio);
            }

            let token = makeid(25);

            map = map.replace(/issou/g, token);

            let map_file = `API/ressources/${socket['id']}.as`
            fs.writeFileSync(map_file, map);

            fs.readFile(`API/ressources/gui.swf`, (err, data) => {

                let base = data;
                let header = Buffer.from(base.slice(0, 8));

                zlib.inflate(data.slice(8), (err, buff) => {
                    if (err) {
                        throw err;
                    }
                    buff = Buffer.from(buff);

                    let _token = 'TOKENTOKENTOKENTOKENTOKEN'

                    buff = replace(buff, _token, token);

                    zlib.deflate(buff, (err, unzip) => {
                        let final = Buffer.concat([header, unzip]);

                        //fs.writeFileSync(`API/ressources/${socket['id']}_.swf`, final);

                        let _base = base.slice(3);

                        execSync(`"${this.core}" -replace API/ressources/map.swf API/ressources/${socket['id']}.swf 2 ${socket['graphic']} 10 ${socket['physic']} 12 ${socket['environment']} "Map" ${map_file}`);

                        fs.readFile(`API/ressources/${socket['id']}.swf`, (err, data) => {


                            let is = new InputStream(data);
                            let parser = new SWF(is, final.slice(3)),
                                os = new OutputStream();

                            parser.saveTo(os, `API/htdocs/caches/${socket['id']}.swf`);




                            print('-> Map compilé avec succès !');

                            caches.push(`API/htdocs/caches/${socket['id']}.swf`);

                            socket.emit('map');

                            socket['create'] = true;

                            try {
                                fs.unlinkSync(socket['graphic']);
                                fs.unlinkSync(socket['physic']);
                                fs.unlinkSync(socket['environment']);
                                fs.unlinkSync(map_file);
                            } catch (e) {
                                print('warn -> ' + e.toString())
                            }
                        });

                    });
                });
            });
        }

        socket.emit('init', socket['id']);

        let uploader = new SocketIOFile(socket, {
            uploadDir: 'API/ressources',
            accepts: ['image/png'],
            maxFileSize: 4194304,
            chunkSize: 10240,
            transmissionDelay: 0,
            overwrite: true,
            rename: function(filename, fileInfo) {
                let file = path.parse(filename);
                let ext = file.ext;
                return `${socket['id']}_map${ext}`
            }
        });

        uploader.on('complete', (fileInfo) => {
            socket['graphic'] = `API/ressources/${socket['id']}_map.png`;
            createSWF();
        });

        socket.on('collision', (buff) => {

            buff = buff.replace(/^data:image\/png;base64,/, "");
            socket['physic'] = `API/ressources/${socket['id']}_colli.png`;

            fs.writeFile(`API/ressources/${socket['id']}_colli.png`, buff, { encoding: 'base64' }, (err) => {
                if (err) {
                    print('Une erreur est survenue : ' + err);
                    return;
                }
                socket.emit('getenvironment');
            });
        });

        socket.on('environment', (buff) => {

            buff = buff.replace(/^data:image\/png;base64,/, "");
            socket['environment'] = `API/ressources/${socket['id']}_env.png`;

            fs.writeFile(`API/ressources/${socket['id']}_env.png`, buff, { encoding: 'base64' }, (err) => {
                if (err) {
                    print('Une erreur est survenue : ' + err);
                    return;
                }
                print('-> Upload: OK');
                socket.emit('getPicture');
            });
        });

        socket.on('settings', (params) => {
            socket['params'] = params;
        });

        socket.on('disconnect', () => {

        });
    }

}

function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

module.exports = API;