var fs = require('fs');
var path = require('path');
var evs = require('event-stream');
var gutil = require('gulp-util');
var request = require('sync-request');

var patterns = {
    html: /([<][!][-]{2}).?import[(]?.?["'](.*)["'].?[)]?.?[-]{2}[>]/g,
    js: /([\/]{2}|[\/][*]).?import.?[(]?.?["'](.*)["'].?[)]?[;]?.*?(\n[*][\/])?/g,
    css: /([\/]{2}|[\/][*]).?import[(]?.?["'](.*)["'].?[)]?([*][\/])?/g,
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
    if (match) {
        var filepath;
        if (match[2].startsWith("http://") || match[2].startsWith("https://")) {
            filepath = match[2];
        } else {
            filepath = path.join(dirname, match[2]);
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