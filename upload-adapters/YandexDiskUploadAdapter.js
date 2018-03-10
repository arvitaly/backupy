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
const fs_1 = require("fs");
const createClient = require("webdav");
class YandexDiskUploadAdapter {
    constructor(config) {
        this.config = config;
        this.client = createClient("https://webdav.yandex.ru", this.config.username, this.config.password);
    }
    list() {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.client.getDirectoryContents(this.config.uploadDir);
            return res;
        });
    }
    remove(filename) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.unlink(filename);
        });
    }
    upload(inputFile, filename) {
        return __awaiter(this, void 0, void 0, function* () {
            const uploadDir = this.config.uploadDir + "/" + filename;
            const out = this.client.createWriteStream(uploadDir);
            const inp = fs_1.createReadStream(inputFile);
            return new Promise((resolve, reject) => {
                this.config.logger.log("Upload to " + uploadDir);
                inp.pipe(out);
                inp.on("error", (err) => reject(err));
                out.on("error", (err) => reject(err));
                inp.on("end", () => {
                    this.config.logger.log("Uploaded");
                    resolve();
                });
            });
        });
    }
}
exports.default = YandexDiskUploadAdapter;
