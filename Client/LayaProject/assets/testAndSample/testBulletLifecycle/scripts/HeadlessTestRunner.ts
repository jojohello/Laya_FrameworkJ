export interface HeadlessTestCase {
    readonly name: string;
    run(): Promise<void> | void;
}

export interface HeadlessTestRunResult {
    totalCount: number;
    failedCount: number;
    passed: boolean;
}

export class HeadlessTestRunner {
    constructor(private readonly _cases: readonly HeadlessTestCase[]) {
    }

    async run(): Promise<HeadlessTestRunResult> {
        let failedCount = 0;
        for (const testCase of this._cases) {
            try {
                await testCase.run();
                console.info(`[HeadlessTest] PASS ${testCase.name}`);
            } catch (error) {
                failedCount++;
                console.error(`[HeadlessTest] FAIL ${testCase.name}`, error);
            }
        }

        const result: HeadlessTestRunResult = {
            totalCount: this._cases.length,
            failedCount,
            passed: failedCount === 0,
        };
        console.info(`[HeadlessTest] SUMMARY total=${result.totalCount} failed=${result.failedCount}`);
        return result;
    }
}

export function assertHeadless(condition: unknown, message: string): asserts condition {
    if (!condition) throw new Error(message);
}
