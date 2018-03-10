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
const child_process_1 = require("child_process");
const util_1 = require("util");
class MysqlBackupAdapter {
    constructor(config) {
        this.config = config;
    }
    backup(filename) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const res = yield util_1.promisify(child_process_1.exec)(("mysqldump " +
                    (" --host=" + this.config.host) +
                    (" --password=" + this.config.password) +
                    (" --user=" + this.config.user) +
                    (this.config.databases === "*" ? " --all-databases " :
                        " --databases " + this.config.databases.join(","))
                    + " > " + filename));
                this.config.logger.log("Stdout: " + res.stdout + "\nStderr: " + res.stderr);
            }
            catch (e) {
                throw new Error("Error with mysql backup " + e.toString());
            }
        });
    }
}
exports.default = MysqlBackupAdapter;
