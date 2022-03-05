const Api = require("./API");

const api = new Api({
    PORT: 80,
    CORE: "./jpexs/ffdec.bat"
});

api.init();