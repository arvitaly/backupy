import { IStrategy, IStrategyTickInfo, IStrategyTickResult } from "./../Backupy";

export interface IDailyStrategyConfig {
    cron: string;
}
class DailyStrategy implements IStrategy {
    public async tick(info: IStrategyTickInfo): Promise<IStrategyTickResult> {
        const currentDate = new Date().getTime();
        const found = info.existingBackups.find((b) => this.timeToBase(b.timestamp) === this.timeToBase(currentDate));
        return {
            forRemoving: [],
            isCreate: !found,
        };
    }
    protected timeToBase(timestamp: number) {
        const dt = new Date(timestamp);
        dt.setHours(0, 0, 0, 0);
        return dt.getTime();
    }
}
export default DailyStrategy;
