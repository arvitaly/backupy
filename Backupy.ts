import crypto = require("crypto");
import fs = require("fs");
import sleep from "sleep-es6";
import { promisify } from "util";
import zlib = require("zlib");
export interface IBackupyConfig {
    cron: string | Date;
    backupAdapter: IBackupAdapter;
    uploadAdapter: IUploadAdapter;
    tmpDir?: string;
    fileNameTemplate?: string;
    encriptionKey?: string;
    logger: { log: (...args: any[]) => void };
    strategy: IStrategy;
}
export interface IStrategyTickInfoFile {
    filename: string;
    basename: string;
    size: number;
    timestamp: number;
}
export interface IStrategyTickInfo {
    existingBackups: IStrategyTickInfoFile[];
}
export interface IStrategyTickResult {
    forRemoving: string[];
    isCreate: boolean;
}
export interface IStrategy {
    tick(info: IStrategyTickInfo): Promise<IStrategyTickResult>;
}
export interface IBackupAdapter {
    backup(filename: string): Promise<void>;
}
export interface IUploadAdapter {
    list(): Promise<Array<{
        filename: string;
        basename: string;
        size: number;
    }>>;
    remove(filename: string): Promise<void>;
    upload(inputFile: string, filename: string): Promise<void>;
}
export default class Backupy {
    protected fileNameTemplate = "%y%_%M%_%d%_%h%_%m%_%s%_%ms%";
    protected tmpDir = __dirname + "/tmp";
    protected isStopped = false;
    constructor(protected config: IBackupyConfig) {
        if (this.config.fileNameTemplate) {
            this.fileNameTemplate = this.config.fileNameTemplate;
        }
        if (this.config.tmpDir) {
            this.tmpDir = this.config.tmpDir;
        }
    }
    public async start() {
        while (!this.isStopped) {
            try {
                await this.tick();
            } catch (e) {
                this.config.logger.log(e);
            }
            await sleep(60 * 1000);
        }
    }
    public stop() {
        this.isStopped = true;
    }
    protected async tick() {
        const tickResult = await this.config.strategy.tick({
            existingBackups: (await this.config.uploadAdapter.list()).map((f) => ({
                ...f,
                timestamp: this.parseFileName(f.basename),
            })),
        });
        this.config.logger.log("For removing: " + tickResult.forRemoving);
        // remove files
        await Promise.all(tickResult.forRemoving.map((f) => this.config.uploadAdapter.remove(f)));
        if (!tickResult.isCreate) {
            this.config.logger.log("Not found for create");
            return;
        }
        this.config.logger.log("Create new backup");
        const baseFileName = this.createFileName() + "~" + (+new Date().getTime());
        let backupFile = this.tmpDir + "/" + baseFileName;
        await this.config.backupAdapter.backup(backupFile);

        if (this.config.encriptionKey) {
            const cipher = crypto.createCipher("aes-256-cbc", this.config.encriptionKey);
            const input = fs.createReadStream(backupFile);
            const output = fs.createWriteStream(backupFile + ".enc");
            input.pipe(cipher).pipe(output);
            await new Promise((resolve) => {
                output.on("finish", () => resolve());
            });
            this.config.logger.log("Encrypted file written to disk!");
            await promisify(fs.unlink)(backupFile);
            backupFile = backupFile + ".enc";
        }
        const gzip = zlib.createGzip();
        const inp = fs.createReadStream(backupFile);
        const out = fs.createWriteStream(backupFile + ".gz");
        await new Promise((resolve) => {
            inp.pipe(gzip).pipe(out);
            out.on("close", () => resolve());
        });
        await promisify(fs.unlink)(backupFile);
        backupFile = backupFile + ".gz";
        this.config.logger.log("Backup created: " + backupFile);
        await this.config.uploadAdapter.upload(backupFile, baseFileName);
        await promisify(fs.unlink)(backupFile);
    }
    protected parseFileName(filename: string) {
        const params = filename.split("~");
        return parseInt(params[1], 10);
    }
    protected createFileName() {
        const dt = new Date();
        return this.fileNameTemplate
            .replace("%y%", dt.getFullYear().toString())
            .replace("%M%", (dt.getMonth() + 1).toString())
            .replace("%d%", dt.getDate().toString())
            .replace("%h%", dt.getHours().toString())
            .replace("%m%", dt.getMinutes().toString())
            .replace("%s%", dt.getSeconds().toString())
            .replace("%ms%", dt.getMilliseconds().toString())
            ;
    }
}
