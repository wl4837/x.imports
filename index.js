var fs = require('fs');
var path = require('path');
var evs = require('event-stream');
var gutil = require('gulp-util');
var request = require('sync-request');

var patterns = {
    html: /([<][!][-]{2}).?import[(]?.?["'](.*)["'].?[);]?.?[-]{2}[>]/g,
    htm: /([<][!][-]{2}).?import[(]?.?["'](.*)["'].?[);]?.?[-]{2}[>]/g,
    ejs: /([<][!][-]{2}).?import[(]?.?["'](.*)["'].?[);]?.?[-]{2}[>]/g,
    js: /([\/]{2}|[\/][*]).?import.?[(]?.?["'](.*)["'].?[)]?[;]?.*?(\n[*][\/])?.*/g,
    css: /([\/]{2}|[\/][*]).?import.?[(]?.?["'](.*)["'].?[)]?[;]?.*?(\n[*][\/])?.*/g,
    yaml: /([ \t]*)[-][ ]?import[:][ ]*["'](.*)["']/g,
    yml: /([ \t]*)[-][ ]?import[:][ ]*["'](.*)["']/g,
    json: /([ \t]*)[-][ ]?import[:][ ]*["'](.*)["']/g
};

var getExtension = function (p) {
    return path.extname(p).substr(1).toLowerCase();
};

function getImport(ext, contents, dirname) {
    patterns[ext].lastIndex = 0; // OH lastIndex - how I HATE you.
    var match = patterns[ext].exec(contents);

    /* 匹配 HTML 中的 javascript */
    if ( !match ) {
        switch ( ext ) {
            case "html": match = /([\/]{2}|[\/][*]).?import.?[(]?.?["'](.*)["'].?[)]?[;]?.*?(\n[*][\/])?.*/g.exec(contents); break;
            case "htm": match = /([\/]{2}|[\/][*]).?import.?[(]?.?["'](.*)["'].?[)]?[;]?.*?(\n[*][\/])?.*/g.exec(contents); break;
            case "ejs": match = /([\/]{2}|[\/][*]).?import.?[(]?.?["'](.*)["'].?[)]?[;]?.*?(\n[*][\/])?.*/g.exec(contents); break;
        }
    }

    if (match) {
        var filepath;
        if (match[2].startsWith("http://") || match[2].startsWith("https://")) {
            filepath = match[2];
        } else {
            filepath = path.join(dirname, match[2]);
        }
        if ( !fs.existsSync(filepath) ) {
            filepath = path.join(path.resolve(''),match[2]);
            if ( !fs.existsSync(filepath) ) {
                console.log("File not found "+filepath);
                return undefined
            }
        }
        return {
            matchText: match[0],
            index: match.index,
            path: filepath
        };
    } else {
        return undefined
    }
}

function processMatch(_import, contents) {
    var sourceTxt = "//not set!!";
    if (_import.path.startsWith("http://") || _import.path.startsWith("https://")) {
        var res = request('GET', _import.path);
        sourceTxt = String(res.getBody());
    } else {
        sourceTxt = String(fs.readFileSync(_import.path));
    }
    return contents.substring(0, _import.index) +
        processFile(_import.path, sourceTxt) +
        contents.substring(_import.index + _import.matchText.length);
}

function processFile(p, contents) {
    var ext = getExtension(p);
    var processed = contents,
        _import;
    while (_import = getImport(ext, processed, path.dirname(p))) {
        processed = processMatch(_import, processed);
    }
    return processed;
}


module.exports = function () {

    function processImports(file) {
        var contents = String(file.contents);
        var ext = getExtension(file.path);

        // I'm no stream guru - so I have no idea if this can be done.....yet....
        if (file.isStream()) {
            this.emit('error', new gutil.PluginError('gulp-imports', 'Yikes - sorry about this, but streams are not supported yet.'));
        }

        if (patterns.hasOwnProperty(ext)) {
            if (file.isBuffer()) {
                contents = processFile(file.path, contents);
                file.contents = new Buffer(contents);
            }
        }
        this.emit('data', file);
    }

    return evs.through(processImports);
};
