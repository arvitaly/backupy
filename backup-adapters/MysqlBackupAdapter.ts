import { exec } from "child_process";
import { promisify } from "util";
export interface IMysqlBackupAdapterConfig {
    databases: string[] | "*";
    host: string;
    password: string;
    user: string;
    logger: { log: (...args: any[]) => void };
}
class MysqlBackupAdapter {
    constructor(protected config: IMysqlBackupAdapterConfig) {

    }
    public async backup(filename: string) {
        try {
            const res = await promisify(exec)(("mysqldump " +
                (" --host=" + this.config.host) +
                (" --password=" + this.config.password) +
                (" --user=" + this.config.user) +
                (this.config.databases === "*" ? " --all-databases " :
                    " --databases " + this.config.databases.join(","))
                + " > " + filename));
            this.config.logger.log("Stdout: " + res.stdout + "\nStderr: " + res.stderr);
        } catch (e) {
            throw new Error("Error with mysql backup " + e.toString());
        }
    }
}
export default MysqlBackupAdapter;
