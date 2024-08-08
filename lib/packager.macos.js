"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMacOsInstallerOnMacOs = createMacOsInstallerOnMacOs;
exports.createWindowsInstallerOnMacOs = createWindowsInstallerOnMacOs;
const path = require("path");
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const utils_1 = require("./utils");
const shell_quote_1 = require("shell-quote");
const postinstall_1 = require("./templates/macos/postinstall");
const postinstallcs_1 = require("./templates/macos/postinstallcs");
const distribution_xml_1 = require("./templates/macos/distribution.xml");
const nsis_conf_1 = require("./templates/windows/nsis.conf");
const nsiscs_conf_1 = require("./templates/windows/nsiscs.conf");
const signcode = require("signcode");
function createMacOsInstallerOnMacOs(opts) {
    createMacOsMeta(opts);
    createMacOsTemplates(opts);
    createMacOsInstallerFiles(opts);
    createMacOsScripts(opts);
    pkgbuild(opts);
    productbuild(opts);
}
function createMacOsMeta(opts) {
    console.log('-> createMacOsMeta');
    (0, utils_1.mkdirp)(opts.paths.macOsMeta);
}
function createMacOsTemplates(opts) {
    console.log('-> createMacOsTemplates');
    (0, fs_1.writeFileSync)(opts.paths.macOsDistributionXmlFile, opts.distibutionTemplate ? opts.distibutionTemplate(opts) : (0, distribution_xml_1.default)(opts));
}
function createMacOsInstallerFiles(opts) {
    console.log('-> createMacOsInstallerFiles');
    (0, utils_1.mkdirp)(opts.paths.macOsInstallerFiles);
}
function createMacOsScripts(opts) {
    console.log('-> createMacOsScripts');
    (0, utils_1.mkdirp)(opts.paths.macOsScripts);
    (0, fs_1.writeFileSync)(opts.paths.macOsPostinstallFile, opts.postinstallTemplate
        ? opts.postinstallTemplate(opts)
        : (opts.cs ? (0, postinstallcs_1.default)(opts) : (0, postinstall_1.default)(opts)));
    (0, fs_1.chmodSync)(opts.paths.macOsPostinstallFile, '0777');
    (0, utils_1.cp)(opts.paths.zxpFile, opts.paths.macOsZxpFile);
    if (!opts.cs) {
        (0, child_process_1.execSync)(`unzip "${opts.paths.vendors.macos}" -d "${opts.paths.macOsScripts}/ExManCmd_mac"`);
    }
}
function pkgbuild(opts) {
    console.log('-> pkgbuild');
    let pkgbuildCmd = [
        ...((opts.macOs.keychain || opts.macOs.keychainPassword) && opts.unlockKeychain !== false ? [
            'security', '-v', 'unlock-keychain',
            ...(opts.macOs.keychainPassword ?
                ['-p', (0, shell_quote_1.quote)([opts.macOs.keychainPassword])] : []),
            (0, shell_quote_1.quote)([opts.macOs.keychain || 'login.keychain']),
            '&&',
        ] : []),
        '/usr/bin/pkgbuild',
        '--root', (0, shell_quote_1.quote)([opts.paths.macOsInstallerFiles]),
        '--scripts', (0, shell_quote_1.quote)([opts.paths.macOsScripts]),
        '--install-location', (0, shell_quote_1.quote)([`/tmp/.${opts.bundleId}-installer`]),
        ...(opts.macOs.keychain && opts.macOs.keychain !== 'login.keychain' ? ['--keychain', (0, shell_quote_1.quote)([opts.macOs.keychain || 'login.keychain'])] : []),
        '--identifier', (0, shell_quote_1.quote)([opts.bundleId]),
        '--timestamp',
        '--version', (0, shell_quote_1.quote)([opts.version]),
        ...(opts.macOs && opts.macOs.identifier ?
            ['--sign', (0, shell_quote_1.quote)([opts.macOs.identifier])] : []),
        (0, shell_quote_1.quote)([opts.paths.macOsInstallerFile])
    ].join(' ');
    opts.debug && console.log(pkgbuildCmd);
    const stdioOpts = opts.debug ? { stdio: 'inherit' } : { stdio: 'ignore' };
    (0, child_process_1.execSync)(pkgbuildCmd, stdioOpts);
}
function productbuild(opts) {
    console.log('-> productbuild');
    (0, utils_1.mkdirp)(path.dirname(opts.macOs.dest));
    let productbuildCmd = [
        ...((opts.macOs.keychain || opts.macOs.keychainPassword) && opts.unlockKeychain !== false ? [
            'security', '-v', 'unlock-keychain',
            ...(opts.macOs.keychainPassword ?
                ['-p', (0, shell_quote_1.quote)([opts.macOs.keychainPassword])] : []),
            (0, shell_quote_1.quote)([opts.macOs.keychain || 'login.keychain']),
            '&&',
        ] : []),
        'productbuild',
        '--timestamp',
        ...(opts.macOs.keychain && opts.macOs.keychain !== 'login.keychain' ? ['--keychain', (0, shell_quote_1.quote)([opts.macOs.keychain || 'login.keychain'])] : []),
        '--distribution', (0, shell_quote_1.quote)([opts.paths.macOsDistributionXmlFile]),
        '--package-path', (0, shell_quote_1.quote)([opts.paths.macOsMeta]),
        '--resources', (0, shell_quote_1.quote)([opts.macOs.resources]),
        ...(opts.macOs && opts.macOs.identifier ?
            ['--sign', (0, shell_quote_1.quote)([opts.macOs.identifier])] : []),
        (0, shell_quote_1.quote)([opts.macOs.dest])
    ].join(' ');
    opts.debug && console.log(productbuildCmd);
    (0, child_process_1.execSync)(productbuildCmd).toString();
}
async function createWindowsInstallerOnMacOs(opts) {
    console.log('-> createWindowsInstallerOnMacOs');
    createWindowsMeta(opts);
    createWindowsTemplates(opts);
    createWindowsInstallerFiles(opts);
    (0, utils_1.mkdirp)(path.dirname(opts.windows.dest));
    makensis(opts);
    signexe(opts);
}
function createWindowsMeta(opts) {
    console.log('-> createWindowsMeta');
    (0, utils_1.mkdirp)(opts.paths.windowsMeta);
}
function createWindowsTemplates(opts) {
    console.log('-> createWindowsTemplates');
    (0, fs_1.writeFileSync)(opts.paths.windowsNsisConfFile, opts.nsisTemplate
        ? opts.nsisTemplate(opts)
        : (opts.cs ? (0, nsiscs_conf_1.default)(opts) : (0, nsis_conf_1.default)(opts)));
}
function createWindowsInstallerFiles(opts) {
    console.log('-> createWindowsInstallerFiles');
    (0, utils_1.mkdirp)(opts.paths.windowsInstallerFiles);
    if (!opts.cs) {
        const exManCmdSrc = path.join(__dirname, '../vendor/ExManCmd_win.zip');
        (0, child_process_1.execSync)(`unzip "${exManCmdSrc}" -d "${opts.paths.windowsInstallerFiles}/ExManCmd_win"`);
    }
    (0, utils_1.cp)(opts.paths.zxpFile, opts.paths.windowsZxpFile);
}
function makensis(opts) {
    console.log('-> makensis');
    const makensisResult = (0, child_process_1.execSync)([
        'cd', (0, shell_quote_1.quote)([opts.windows.resources]),
        '&&',
        '/usr/local/bin/makensis', (0, shell_quote_1.quote)([opts.paths.windowsNsisConfFile])
    ].join(' ')).toString();
    console.log(makensisResult);
}
function signexe(opts) {
    if (opts.windows.cert) {
        console.log('-> signexe');
        var options = {
            cert: opts.windows.cert,
            password: opts.windows.certPassword,
            overwrite: true,
            path: opts.windows.dest,
            site: opts.windows.site,
            name: opts.name
        };
        signcode.sign(options, function (error) {
            if (error) {
                console.error('Signing failed', error.message);
            }
            else {
                console.log(options.path + ' is now signed');
            }
        });
    }
}
