var SourceUnit = (function () {
    function SourceUnit() {
    }
    SourceUnit.readSourceUnit = function (callback) {
        process.stdin.setEncoding('utf8');
        var data = '';
        process.stdin.on('readable', function () {
            var chunk = process.stdin.read();
            if (chunk) {
                data += chunk;
            }
        });
        process.stdin.on('end', function () {
            callback(null, data);
        });
        process.stdin.on('error', function (e) {
            callback(e);
        });
    };
    return SourceUnit;
})();
//# sourceMappingURL=unit.js.map