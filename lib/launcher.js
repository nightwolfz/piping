var cluster = require("cluster");
var path = require("path");
var natives = ['assert', 'buffer', 'child_process', 'cluster', 'console', 'constants', 'crypto', 'dgram', 'dns', 'domain', 'events', 'freelist', 'fs', 'http', 'https', 'module', 'net', 'os', 'path', 'punycode', 'querystring', 'readline', 'repl', 'stream', 'string_decoder', 'sys', 'timers', 'tls', 'tty', 'url', 'util', 'vm', 'zlib'];
var languages = {".coffee": "coffee-script"}

;
cluster.worker.on("message", function(options){
    var main = path.resolve(process.cwd(), options.main);
    if (options.hook) {
        var module = require("module");
        var _load_orig = module._load;

        module._load = function(name, parent, isMain){
            var file = module._resolveFilename(name, parent);

            if (options.includeModules || file.indexOf("node_modules") === -1) {
                if (!(natives.indexOf(file) >= 0 || file === main)) {
                    cluster.worker.send({file: file});
                }
            }

            return _load_orig(name, parent, isMain);
        };
    }
    var ext = path.extname(options.main);
    if (languages[ext]) {
        require(languages[ext]);
    }
    if (options.languages) {
        options.languages.forEach(function(module){
            require(module);
        });
    }

    return require(main);
});

process.on("uncaughtException", function(err){
    cluster.worker.send({
        err: ((typeof err !== "undefined" && err !== null) ? err.stack : undefined) || err
    });
    return cluster.worker.kill();
});
