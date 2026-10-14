const fs = require('fs');

function mapWindowsReadlinkError(err, p) {
    if (err && err.code === 'EISDIR') {
        const einvalErr = new Error(`EINVAL: invalid argument, readlink '${p}'`);
        einvalErr.code = 'EINVAL';
        einvalErr.errno = -4071;
        einvalErr.syscall = 'readlink';
        einvalErr.path = p;
        return einvalErr;
    }
    return err;
}

const origReadlink = fs.readlink;
fs.readlink = function(p, options, callback) {
    if (typeof options === 'function') {
        callback = options;
        options = {};
    }
    return origReadlink.call(fs, p, options, (err, target) => {
        return callback(mapWindowsReadlinkError(err, p), target);
    });
};

const origReadlinkSync = fs.readlinkSync;
fs.readlinkSync = function(p, options) {
    try {
        return origReadlinkSync.call(fs, p, options);
    } catch (err) {
        throw mapWindowsReadlinkError(err, p);
    }
};

if (fs.promises && fs.promises.readlink) {
    const origPromisesReadlink = fs.promises.readlink;
    fs.promises.readlink = async function(p, options) {
        try {
            return await origPromisesReadlink.call(fs.promises, p, options);
        } catch (err) {
            throw mapWindowsReadlinkError(err, p);
        }
    };
}
