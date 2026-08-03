import { UIManager } from "../ui/UIManager";

/** Stable route keys used by MainNav.json. Config must not contain class names. */
export class MainNavRouteRegistry {
    static closeMainContent(exceptName: string = ""): void {
        UIManager.instance.closeLayer("MainContent", exceptName);
    }

    static async open(routeKey: string, routeArgs: readonly any[] = []): Promise<void> {
        switch (routeKey) {
            case "main.bag":
                this.closeMainContent("BagUI");
                await UIManager.instance.open("BagUI", { args: routeArgs });
                return;
            case "main.shop":
                this.closeMainContent();
                await UIManager.instance.open("ShopUI", { args: routeArgs });
                return;
            case "main.world":
            case "battle.stage":
                this.closeMainContent();
                return;
            case "main.settings":
                console.warn("[MainNavRouteRegistry] route 尚未实现: main.settings");
                return;
            default:
                console.warn(`[MainNavRouteRegistry] 未注册 route: ${routeKey}`);
        }
    }
}
