"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInstallers = createInstallers;
const path = require("path");
const os_1 = require("os");
const fs_1 = require("fs");
const zxp_sign_cmd_1 = require("zxp-sign-cmd");
const child_process_1 = require("child_process");
const packager_macos_1 = require("./packager.macos");
const packager_windows_1 = require("./packager.windows");
const utils_1 = require("./utils");
async function createInstallers(opts) {
    opts.paths = opts.paths || {};
    opts.paths.cwd = opts.paths.cwd || path.join('/tmp', opts.bundleId);
    opts.paths.templates = opts.paths.templates || path.join(__dirname, '..', 'templates');
    opts.paths.macOs = opts.paths.macOs || path.join(opts.paths.cwd, 'macos');
    opts.paths.macOsInstallerFiles = opts.paths.macOsInstallerFiles || path.join(opts.paths.macOs, 'installer-files');
    opts.paths.macOsScripts = opts.paths.macOsScripts || path.join(opts.paths.macOs, 'scripts');
    opts.paths.macOsTemplates = opts.paths.macOsTemplates || path.join(opts.paths.templates, 'macos');
    opts.paths.macOsMeta = opts.paths.macOsMeta || path.join(opts.paths.macOs, 'meta');
    opts.paths.windows = opts.paths.windows || path.join(opts.paths.cwd, 'windows');
    opts.paths.windowsInstallerFiles = opts.paths.windowsInstallerFiles || path.join(opts.paths.windows, 'installer-files');
    opts.paths.windowsTemplates = opts.paths.windowsTemplates || path.join(opts.paths.templates, 'windows');
    opts.paths.windowsMeta = opts.paths.windowsMeta || path.join(opts.paths.windows, 'meta');
    opts.paths.zxpFile = opts.paths.zxpFile || path.join(opts.paths.cwd, 'bundle.zxp');
    opts.paths.macOsDistributionXmlFile = path.join(opts.paths.macOsMeta, 'distribution.xml');
    opts.paths.macOsPostinstallFile = path.join(opts.paths.macOsScripts, 'postinstall');
    opts.paths.macOsZxpFile = path.join(opts.paths.macOsScripts, 'bundle.zxp');
    opts.paths.windowsZxpFile = path.join(opts.paths.windowsInstallerFiles, 'bundle.zxp');
    opts.paths.macOsInstallerFile = path.join(opts.paths.macOsMeta, 'installer.pkg');
    opts.paths.windowsNsisConfFile = path.join(opts.paths.windowsMeta, 'nsis.conf');
    opts.paths.vendors = opts.paths.vendor || {};
    opts.paths.vendors.macos = opts.paths.vendor.macos || path.join(opts.paths.cwd, 'vendor/ExManCmd_mac.zip');
    opts.paths.vendors.win = opts.paths.vendor.win || path.join(opts.paths.cwd, 'vendor/ExManCmd_win.zip');
    try {
        (0, utils_1.rmrf)(opts.paths.cwd);
        (0, fs_1.mkdirSync)(opts.paths.cwd);
        if (opts.src.indexOf('.zxp') > -1) {
            opts.paths.zxpFile = opts.src;
        }
        else {
            await createZXP(opts);
        }
        if ((0, os_1.platform)() === 'darwin') {
            (0, packager_macos_1.createWindowsInstallerOnMacOs)(opts);
            (0, packager_macos_1.createMacOsInstallerOnMacOs)(opts);
        }
        else {
            (0, packager_windows_1.createWindowsInstallerOnWindows)(opts);
        }
    }
    catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}
async function createZXP(opts) {
    try {
        if (!opts.zxp)
            opts.zxp = {};
        if (!opts.zxp.cert) {
            if (!opts.zxp.certPassword)
                opts.zxp.certPassword = 'password';
            opts.zxp.cert = path.join(opts.paths.cwd, 'zxp-cert.p12');
            const certRes = await selfSignedCertPromise({
                country: opts.zxp.certCountry || 'US',
                province: opts.zxp.certProvince || 'NY',
                org: opts.zxp.certOrg || 'ACME',
                name: opts.zxp.certName || 'ACME',
                output: opts.zxp.cert,
                password: opts.zxp.certPassword
            });
            console.log(certRes.trim());
        }
        const signRes = await signPromise({
            input: opts.src,
            output: opts.paths.zxpFile,
            cert: opts.zxp.cert,
            password: opts.zxp.certPassword,
            timestamp: opts.zxp.timestamp
        });
        console.log(signRes.trim());
        if (opts.zxp.dest) {
            (0, utils_1.mkdirp)(path.dirname(opts.zxp.dest));
            (0, child_process_1.execSync)(`cp "${opts.paths.zxpFile}" "${opts.zxp.dest}"`);
        }
    }
    catch (err) {
        console.log(err);
    }
}
function selfSignedCertPromise(opts) {
    return new Promise((resolve, reject) => {
        (0, zxp_sign_cmd_1.selfSignedCert)(opts, (err, res) => {
            if (err)
                return reject(err);
            resolve(res);
        });
    });
}
function signPromise(opts) {
    return new Promise((resolve, reject) => {
        (0, zxp_sign_cmd_1.sign)(opts, (err, res) => {
            if (err)
                return reject(err);
            resolve(res);
        });
    });
}
