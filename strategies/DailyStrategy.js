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
class DailyStrategy {
    tick(info) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentDate = new Date().getTime();
            const found = info.existingBackups.find((b) => this.timeToBase(b.timestamp) === this.timeToBase(currentDate));
            return {
                forRemoving: [],
                isCreate: !found,
            };
        });
    }
    timeToBase(timestamp) {
        const dt = new Date(timestamp);
        dt.setHours(0, 0, 0, 0);
        return dt.getTime();
    }
}
exports.default = DailyStrategy;
