"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require("crypto");
const fs = require("fs");
const sleep_es6_1 = require("sleep-es6");
const util_1 = require("util");
const zlib = require("zlib");
class Backupy {
    constructor(config) {
        this.config = config;
        this.fileNameTemplate = "%y%_%M%_%d%_%h%_%m%_%s%_%ms%";
        this.tmpDir = process.cwd() + "/tmp";
        this.isStopped = false;
        if (this.config.fileNameTemplate) {
            this.fileNameTemplate = this.config.fileNameTemplate;
        }
        if (this.config.tmpDir) {
            this.tmpDir = this.config.tmpDir;
        }
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            while (!this.isStopped) {
                try {
                    yield this.tick();
                }
                catch (e) {
                    this.config.logger.log(e);
                }
                yield sleep_es6_1.default(60 * 1000);
            }
        });
    }
    stop() {
        this.isStopped = true;
    }
    tick() {
        return __awaiter(this, void 0, void 0, function* () {
            const tickResult = yield this.config.strategy.tick({
                existingBackups: (yield this.config.uploadAdapter.list()).map((f) => (Object.assign({}, f, { timestamp: this.parseFileName(f.basename) }))),
            });
            this.config.logger.log("For removing: " + tickResult.forRemoving);
            // remove files
            yield Promise.all(tickResult.forRemoving.map((f) => this.config.uploadAdapter.remove(f)));
            if (!tickResult.isCreate) {
                this.config.logger.log("Not found for create");
                return;
            }
            this.config.logger.log("Create new backup");
            const baseFileName = this.createFileName() + "~" + (+new Date().getTime());
            let backupFile = this.tmpDir + "/" + baseFileName;
            yield this.config.backupAdapter.backup(backupFile);
            if (this.config.encriptionKey) {
                const cipher = crypto.createCipher("aes-256-cbc", this.config.encriptionKey);
                const input = fs.createReadStream(backupFile);
                const output = fs.createWriteStream(backupFile + ".enc");
                input.pipe(cipher).pipe(output);
                yield new Promise((resolve) => {
                    output.on("finish", () => resolve());
                });
                this.config.logger.log("Encrypted file written to disk!");
                yield util_1.promisify(fs.unlink)(backupFile);
                backupFile = backupFile + ".enc";
            }
            const gzip = zlib.createGzip();
            const inp = fs.createReadStream(backupFile);
            const out = fs.createWriteStream(backupFile + ".gz");
            yield new Promise((resolve) => {
                inp.pipe(gzip).pipe(out);
                out.on("close", () => resolve());
            });
            yield util_1.promisify(fs.unlink)(backupFile);
            backupFile = backupFile + ".gz";
            this.config.logger.log("Backup created: " + backupFile);
            yield this.config.uploadAdapter.upload(backupFile, baseFileName);
            yield util_1.promisify(fs.unlink)(backupFile);
        });
    }
    parseFileName(filename) {
        const params = filename.split("~");
        return parseInt(params[1], 10);
    }
    createFileName() {
        const dt = new Date();
        return this.fileNameTemplate
            .replace("%y%", dt.getFullYear().toString())
            .replace("%M%", (dt.getMonth() + 1).toString())
            .replace("%d%", dt.getDate().toString())
            .replace("%h%", dt.getHours().toString())
            .replace("%m%", dt.getMinutes().toString())
            .replace("%s%", dt.getSeconds().toString())
            .replace("%ms%", dt.getMilliseconds().toString());
    }
}
exports.default = Backupy;
