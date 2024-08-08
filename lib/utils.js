"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.copyAndReplace = copyAndReplace;
exports.rmrf = rmrf;
exports.mkdirp = mkdirp;
exports.cp = cp;
exports.cpr = cpr;
const fs_1 = require("fs");
const rimraf = require("rimraf");
const mkdirplib = require("mkdirp");
const child_process_1 = require("child_process");
function copyAndReplace(from, to, replace) {
    let contents = (0, fs_1.readFileSync)(from, 'utf8');
    Object.keys(replace).forEach(key => {
        contents = contents.replace(new RegExp(`${key}`, 'g'), replace[key]);
    });
    (0, fs_1.writeFileSync)(to, contents);
}
function rmrf(path) {
    rimraf.sync(path);
}
function mkdirp(path) {
    mkdirplib.sync(path);
}
function cp(from, to) {
    (0, child_process_1.execSync)(`cp ${from} ${to}`);
}
function cpr(from, to) {
    (0, child_process_1.execSync)(`cp -r ${from} ${to}`);
}
