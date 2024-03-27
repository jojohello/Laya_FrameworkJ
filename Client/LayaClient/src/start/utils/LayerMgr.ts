// jojohello 2023-05-16
// 在laya的舞台里面，建立不同的父节点，以便控制不同的层级

// 暂时押后
export class LayerMgr{
    static readonly BelowScene = 1;  // 场景下层
    static readonly Scene = 2;         // 场景层
    static readonly AboveScene = 3;    // 场景上层,用来放不可遮挡的血条之类的
    static readonly MainUI = 4;         // 主界面层
    static readonly UIWindow = 5;       // 弹出的界面窗口
    static readonly TipWindow = 6;      // 弹出的提示层
    static readonly Top = 7;            // 最顶层，用来放loading界面等遮掩一切的界面

    public static init() {
        
    };
}

Laya["LayerMgr"] = LayerMgr;