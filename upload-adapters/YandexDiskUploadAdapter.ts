import { createReadStream } from "fs";
import createClient = require("webdav");
export interface IYandexDiskUploadAdapterConfig {
    username: string;
    password: string;
    uploadDir: string;
    logger: { log: (...args: any[]) => void };
}
class YandexDiskUploadAdapter {
    protected client: any;
    constructor(protected config: IYandexDiskUploadAdapterConfig) {
        this.client = createClient(
            "https://webdav.yandex.ru",
            this.config.username,
            this.config.password,
        );
    }
    public async list() {
        const res = await this.client.getDirectoryContents(this.config.uploadDir);
        return res;
    }
    public async remove(filename: string) {
        return this.client.unlink(filename);
    }
    public async upload(inputFile: string, filename: string) {
        const uploadDir = this.config.uploadDir + "/" + filename;
        const out = this.client.createWriteStream(uploadDir);
        const inp = createReadStream(inputFile);
        return new Promise<void>((resolve, reject) => {
            this.config.logger.log("Upload to " + uploadDir);
            inp.pipe(out);
            inp.on("error", (err) => reject(err));
            out.on("error", (err: any) => reject(err));
            inp.on("end", () => {
                this.config.logger.log("Uploaded");
                resolve();
            });
        });
    }
}
export default YandexDiskUploadAdapter;
