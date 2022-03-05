let collision = 'Solid';
let map = null;
let size = 10;
let privateId = 0;
let params = {};
let isenvironment = false;

params.left = 167;
params.right = 172;
params.top = 69;
params.bottom = 9;
params.porte = 9;
params.x = 950 / 2;
params.y = 425 / 2;
params.audio = '';

let clearCanvas = () => {
    if (!isenvironment) {
        window['ctx'].clearRect(0, 0, window['canvas'].width, window['canvas'].height);
    } else {
        window['env'].clearRect(0, 0, window['environment'].width, window['environment'].height);
    }
}

let changeSizeValue = (trackbar) => {
    let trackbar_value = document.getElementById('trackbar_value');

    if (trackbar_value) {
        trackbar_value.value = `${trackbar.value} px`;
    }
}

let searchID = () => {
    let input = document.getElementById('input_search');
    let content = document.getElementById('result');

    if (input && content) {
        let name = input.value;
        content.innerText = '';

        for (let i in maps) {
            if (maps[i].toUpperCase().includes(name.toUpperCase())) {
                content.innerText += maps[i] + ': ' + i + '\n';
            }
        }
    }
}

let helpMap = () => {
    Swal.fire({
        title: 'Informations MapId',
        showCloseButton: true,
        text: `Le MapId est l'identifiant d'une map, tu peux trouver l'identifiant d'une map grâce à son nom en cliquant sur le module 'Rechercher un ID ?'`,
    });
}

let changeSize = () => {
    Swal.fire({
        title: 'Taille du crayon',
        showCloseButton: true,
        html: `
        Taille : <input type="button" value="${size} px" id="trackbar_value"><br>
        <input type="range" name="size" min="4" max="20" oninput="changeSizeValue(this)" value="${size}">

        `,
    }).then((result) => {
        if (result.value) {

            let search = document.getElementsByName('size');

            for (let i = 0; i < search.length; i++) {
                let trackbar = search[i];

                size = trackbar.value;
            }

            Swal.fire({
                title: 'Paramètre modifié!',
                text: 'Changement de taille du crayon sauvegardé avec succès !',
                icon: 'success'
            });
        }
    });
}

let changeCollision = () => {
    Swal.fire({
        title: 'Type de collision',
        showCloseButton: true,
        html: `

            <input type="radio" id="solid" value="Solid" name="type" ${collision == 'Solid' ? 'checked' : ''}>
            <label for="solid">Solid</label>

            <input type="radio" id="platform" value="Platform" name="type"  ${collision == 'Platform' ? 'checked' : ''}>
            <label for="platform">Platform</label><br><hr>

            <h2>Type de environment</h2>

            <input type="radio" id="door" value="Porte" name="type"  ${collision == 'Porte' ? 'checked' : ''}>
            <label for="door">Porte</label>

            <input type="radio" id="grimpe" value="Grimpe" name="type"  ${collision == 'Grimpe' ? 'checked' : ''}>
            <label for="grimpe">Grimpe</label>

            <input type="radio" id="nage" value="Nage" name="type"  ${collision == 'Nage' ? 'checked' : ''}>
            <label for="nage">Nage</label>

            <input type="radio" id="lava" value="Lave" name="type"  ${collision == 'Lave' ? 'checked' : ''}>
            <label for="lava">Lave</label>

        `,
    }).then((result) => {
        if (result.value) {

            let search = document.getElementsByName('type');

            for (let i = 0; i < search.length; i++) {
                let radio = search[i];

                if (radio.checked) {
                    collision = radio.value;
                }
            }

            Swal.fire(
                'Paramètre modifié!',
                'Collisions sauvegardé avec succès !',
                'success'
            )
        }
    });
}

$(() => {

    let canvas = document.getElementById('collision');
    let ctx = canvas.getContext("2d");

    let environment = document.getElementById('environment');
    let env = environment.getContext("2d");

    let drawing = false;
    let draw = false;
    let canCompile = true;
    let commands = '';
    let commands_params = {};

    let startAt = {};
    let historique = {};
    let historique_index = 0;

    let historique_env = {};
    let historique_env_index = 0;

    window['canvas'] = canvas;
    window['ctx'] = ctx;

    window['environment'] = environment;
    window['env'] = env;

    let socket = io();

    $('#rectangle').on('click', function() {
        $(this).css('transition', '.2s');

        if (commands != 'rectangle') {
            if (commands.length > 0) {
                $('#' + commands).css('background', '#043b79');
            }
            $(this).css('background', '#ff7029');
            commands = 'rectangle';
        } else {
            $(this).css('background', '#043b79');
            commands = '';
        }
    });

    $('#eraser').on('click', function() {
        $(this).css('transition', '.2s');

        if (commands != 'eraser') {
            if (commands.length > 0) {
                $('#' + commands).css('background', '#043b79');
            }
            $(this).css('background', '#ff7029');
            commands = 'eraser';
        } else {
            $(this).css('background', '#043b79');
            commands = '';
        }
    });

    $('#env').on('click', function() {
        if ($(this).is(':checked')) {
            $('#collision').fadeTo("speed", 0.33);
            $('#environment').fadeTo("speed", 1);

            isenvironment = true;
        } else {
            $('#environment').fadeTo("speed", 0.33);
            $('#collision').fadeTo("speed", 1);

            isenvironment = false;
        }
    });

    $('#environment').fadeTo("speed", 0.33)

    $('.picture').mousedown((e) => {
        draw = true;

        startAt.x = e.offsetX;
        startAt.y = e.offsetY;

        let object = canvas;

        if (isenvironment) {
            object = environment;
        }
        commands_params.picture = object.toDataURL();

        if (e.which == 3) {
            return false;
        }
    });

    $('.picture').mouseup((e) => {
        if (draw && drawing && e.which == 3) {
            let object = ctx;

            if (isenvironment) {
                object = env;
            }

            object.beginPath();
            object.lineWidth = size;

            object.moveTo(startAt.x, startAt.y);
            object.lineTo(e.offsetX, e.offsetY);

            if (collision == 'Solid') {
                object.strokeStyle = '#ff00ff';
            } else if (collision == 'Platform') {
                object.strokeStyle = '#ffff00';
            } else if (collision == 'Porte') {
                object.strokeStyle = '#00eeee';
            } else if (collision == 'Grimpe') {
                object.strokeStyle = '#00ff00';
            } else if (collision == 'Nage') {
                object.strokeStyle = '#0000ff';
            } else if (collision == 'Lave') {
                object.strokeStyle = '#ff0000';
            }

            object.stroke();
        }
    });

    $('.picture').contextmenu(() => {
        return false;
    });

    $('.picture').mousemove((event) => {

        if (drawing && draw && event.which == 1) {

            let object = ctx;

            if (isenvironment) {
                object = env;
            }

            object.beginPath();

            if (commands == 'eraser') {
                object.clearRect(Math.round(event.offsetX) - size - 1, Math.round(event.offsetY) - size - 1, size * 2 + 2, size * 2 + 2);
                object.closePath();
            } else {
                if (commands == 'rectangle') {

                    clearCanvas();

                    let image = new Image();
                    image.src = commands_params.picture;

                    commands_params.x = Math.round(event.offsetX);
                    commands_params.y = Math.round(event.offsetY);
                    commands_params.object = object;

                    object.drawImage(image, 0, 0);

                    object.rect(startAt.x, startAt.y, commands_params.x - startAt.x, commands_params.y - startAt.y);
                    object.fill();


                } else {

                    object.arc(Math.round(event.offsetX), Math.round(event.offsetY), size, 0, 2 * Math.PI, false);
                }


                if (collision == 'Solid') {
                    object.fillStyle = '#ff00ff';
                } else if (collision == 'Platform') {
                    object.fillStyle = '#ffff00';
                } else if (collision == 'Porte') {
                    object.fillStyle = '#00eeee';
                } else if (collision == 'Grimpe') {
                    object.fillStyle = '#00ff00';
                } else if (collision == 'Nage') {
                    object.fillStyle = '#0000ff';
                } else if (collision == 'Lave') {
                    object.fillStyle = '#ff0000';
                }

                object.fill();
                object.lineWidth = 1;
            }

        }
        $('#mouseX').val(`mouseX : ${event.offsetX}`);
        $('#mouseY').val(`mouseY : ${event.offsetY}`);
    });

    document.body.onmouseup = () => {

        if (draw && drawing) {
            if (!isenvironment) {
                historique_index++;
                historique[historique_index] = canvas.toDataURL();

                if (commands == 'rectangle') {
                    commands_params.object.rect(startAt.x, startAt.y, commands_params.x - startAt.x, commands_params.y - startAt.y);
                    commands_params.object.fill();
                }
            } else {
                historique_env_index++;
                historique_env[historique_env_index] = environment.toDataURL();
            }
        }

        draw = false;
    }

    $(window).keydown((e) => {

        if (e.keyCode == 90 && e.ctrlKey && (historique_index != 0 || historique_env_index != 0)) {
            clearCanvas();

            let image = new Image();

            if (!isenvironment) {
                historique_index--;

                image.onload = () => {
                    ctx.drawImage(image, 0, 0);
                }

                image.src = historique[historique_index];
            } else {
                historique_env_index--;

                image.onload = () => {
                    env.drawImage(image, 0, 0);
                }

                image.src = historique_env[historique_env_index];
            }

        } else if (e.keyCode == 65 && e.ctrlKey) {
            if (!isenvironment) {
                historique_index++;
                historique[historique_index] = canvas.toDataURL();
            } else {
                historique_env_index++;
                historique_env[historique_env_index] = environment.toDataURL();
            }

            clearCanvas();
            return false;
        }

    });

    $('.fa-info').click(() => {

        Swal.fire(
            'Informations',
            'MapMaker By GregVido',
            'info'
        )

    });

    $('#open_options').click(() => {

        Swal.fire({
            title: 'Options Dessin Collisions',
            html: `
                Type de collision : <input type='button' value='${collision}' onclick='changeCollision()'><br>
                Taille du crayon : <input type='button' value='${size}px' onclick='changeSize()'><br><br>
                <input type='button' value='clear' onclick='clearCanvas()'>
            `,
        });

    });

    $('#parametre').click(() => {

        Swal.fire({
            title: 'Paramètre de la map',
            html: `
            <a onclick='helpMap()'><i class="fa fa-question"></i></a> Map à gauche : <input type='number' id='left' value='${params.left}'><br>
            <a onclick='helpMap()'><i class="fa fa-question"></i></a> Map à droite : <input type='number' id='right' value='${params.right}'><br>
            <a onclick='helpMap()'><i class="fa fa-question"></i></a> Map en haut : <input type='number' id='top' value='${params.top}'><br>
            <a onclick='helpMap()'><i class="fa fa-question"></i></a> Map en bas : <input type='number' id='bottom' value='${params.bottom}'><br>

            <hr>
            <h2>Paramètre de la Porte</h2>

            Map : <input type='number' id='porte' value='${params.porte}'><br>
            Position X Joueur : <input type='number' id='posX' value='${params.x}'><br>
            Position Y Joueur : <input type='number' id='posY' value='${params.y}'><br>

            <hr>
            <h2>Paramètre de la Musique</h2>
            Lien : <input id='audio' value='${params.audio}' placeholder="https://www.site.com/audio.mp3"><br>
            `,
        }).then((result) => {
            if (result.value) {
                params.left = $('#left').val();
                params.right = $('#right').val();
                params.top = $('#top').val();
                params.bottom = $('#bottom').val();

                params.porte = $('#porte').val();
                params.x = $('#posX').val();
                params.y = $('#posY').val();

                params.audio = $('#audio').val();

                socket.emit('settings', params);
            }
        });

    });

    $('#searchID').click(() => {

        Swal.fire({
            title: 'Recherche d\'ID',
            html: `
                <input placeholder='Nom de la map' id='input_search'> <input type='button' value='rechercher' onclick='searchID()'>
                <div id='result'></div>
            `,
        });

    });

    $('.picture-update').dblclick(() => {
        if (drawing) return;

        jQuery('#picture_file').trigger('click');

    });

    $('#load_collision').click(() => {

        jQuery('#picture_file_collision').trigger('click');

    });

    $('#draw_collision').click(() => {

        drawing = !drawing;

        if (drawing) {
            $('.content').css('cursor', 'crosshair');
        } else {
            $('.content').css('cursor', 'default');
        }
    });

    $('#picture_file').change(() => {

        let fileReader = new FileReader();

        fileReader.onload = function() {

            let data = fileReader.result;
            $('.picture').css('background', `url(${data})`);
            $('.picture').css('background-repeat', 'no-repeat');
            $('.fa-plus').css('opacity', '0');

        };

        map = $('#picture_file').prop('files');
        fileReader.readAsDataURL($('#picture_file').prop('files')[0]);
    });

    $('#picture_file_collision').change(() => {
        let fileReader = new FileReader();

        fileReader.onload = function() {
            let data = fileReader.result;

            let img = new Image();

            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, 950, 425);
            }

            img.src = data;
        };

        fileReader.readAsDataURL($('#picture_file_collision').prop('files')[0]);
    });

    let print = (text) => {
        let textArea = $('#log');

        if (textArea.length) {
            textArea.append(`\n${text}`);
            textArea.scrollTop(textArea[0].scrollHeight - textArea.height());
        }
    }

    let uploader = new SocketIOFileClient(socket);

    uploader.on('start', function(fileInfo) {
        print('-> Upload de l\'image en cours ...');
    });
    uploader.on('stream', function(fileInfo) {
        print('-> ' + fileInfo.sent + ' bytes envoyés.');
    });
    uploader.on('complete', function(fileInfo) {
        print('-> Upload: OK');
        print('-> Compilation de la map en cours ...');
    });
    uploader.on('error', function(err) {
        print('Error!', err);
        canCompile = true;
    });

    $('#compile_map').click(() => {
        if (!map) {
            Swal.fire(
                'Oups..',
                'Vous devez upload une image pour votre map.',
                'error'
            )
            return;
        }

        if (!canCompile) {
            return Swal.fire(
                'Oups..',
                'Tu peux compilé qu\'une seule map à la fois.',
                'error'
            );
        }

        canCompile = false;

        print('-> Upload des collisions en cours ...')
        socket.emit('collision', canvas.toDataURL('image/png'));
    });

    socket.on('getenvironment', () => {
        socket.emit('environment', environment.toDataURL('image/png'));
    });

    socket.on('init', (_id) => {
        privateId = _id;
        canCompile = true;
        print('-> Connexion : OK!')
    });

    socket.on('map', (text) => {
        canCompile = true;
        let win = window.open('/caches/' + privateId + '.swf', '_blank');
        win.focus();
    });

    socket.on('log', (text) => {
        print(text)
    });

    socket.on('getPicture', () => {
        uploader.upload(map);
    });

});