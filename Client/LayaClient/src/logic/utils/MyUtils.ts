export class MyUtils {
    public static strEndWith(str: string, endStr: string): boolean {
        let d: number = str.length - endStr.length;

        let index = str.lastIndexOf(endStr);

        return (d >= 0 && str.lastIndexOf(endStr) == d);
    }
}