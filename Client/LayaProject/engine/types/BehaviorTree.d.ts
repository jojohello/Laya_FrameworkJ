declare module BP {
    /**
     *
     * @ brief: BehaviorTreeCreateUtil
     * @ author: zyh
     * @ data: 2024-03-04 16:28
     */
    class BehaviorTreeCreateUtil {
        static __init__(): Promise<void>;
    }
    /**
     *
     * @ brief: BehaviorTreeLoader
     * @ author: zyh
     * @ data: 2024-02-23 15:49
     */
    class BehaviorTreeLoader implements IResourceLoader {
        load(task: ILoadTask): Promise<any>;
        postLoad(task: ILoadTask, btImpl: BehaviorTreeImpl): Promise<void>;
    }
    /**
     *
     * @ brief: BlackboardLoader
     * @ author: zyh
     * @ data: 2024-03-01 15:43
     */
    class BlackboardLoader implements IResourceLoader {
        load(task: ILoadTask): Promise<any>;
        private _parse;
    }
    /**
     *
     * @ brief: BehaviorTreeImpl
     * @ author: zyh
     * @ data: 2024-02-23 15:51
     */
    class BehaviorTreeImpl extends Resource {
        data: any;
        version: number;
        bt: BehaviorTree;
        typeName: string;
        constructor(data: any, task: ILoadTask, version?: number);
        create(): any;
    }
    /**
     *
     * @ brief: BlackboardImpl
     * @ author: zyh
     * @ data: 2024-03-01 15:47
     */
    class BlackboardImpl extends Resource {
        data: any;
        version: number;
        typeName: string;
        constructor(data: any, task: ILoadTask, version?: number);
        create(): any;
    }
    class BehaviorTreeFactory {
        private static _instance;
        private static _btMap;
        constructor();
        static __init__(): void;
        static regBTClass(type: BTType, cls: new () => BTNode): void;
        static initHook(parent: string): void;
        createNew(config: TBTNode): BTNode;
        static get instance(): BehaviorTreeFactory;
    }
    /**
     *
     * @ brief: BehaviorTreeStaticFun
     * @ author: zyh
     * @ data: 2024-03-19 14:28
     */
    class BehaviorTreeStaticFun {
        static runBehaviorTree<T extends Node>(owner: T, behaviorTree: BehaviorTree, excution?: EBTExecutionMode): boolean;
    }
    class BBConst {
        static EXT: string;
        static TYPE: string;
    }
    class BlackboardComponent {
        /**
         * @private
         * @param dataAsset
         */
        init(dataAsset: BlackboardData): void;
        /**
         * @private
         * @param key
         * @returns
         */
        getDefineBykey(key: string): import("./BlackboardData").DataItem;
        /**
         * 根据key获取黑板数值
         * @param key
         * @returns
         */
        getData(key: string): any;
        /**
         * 设置黑板数值
         * @param key
         * @param value
         */
        setData(key: string, value: any): void;
    }
    class BlackboardData {
        keys: Record<string, DataItem>;
        parent: BlackboardData;
        _isInit: boolean;
        constructor();
        init(): void;
        getDataDefineBykeyName(keyName: string): DataItem;
        addKey(data: DataItem): void;
        parse(config: any): void;
    }
    type DataItem = {
        type: EBBType;
        name: string;
    };
    enum EBBType {
        Number = "number",
        String = "string",
        Other = "other"
    }
    enum EBBNumberOperation {
        greater = 0,
        greaterOrEqual = 1,
        equal = 2,
        lessOrEqual = 3,
        less = 4,
        notEqual = 5
    }
    enum EBBStringOperation {
        equal = 0,
        notEqual = 1,
        contain = 2,
        notContain = 3
    }
    enum EBBOtherOperation {
        set = 0,
        unSet = 1
    }
    class BlackBoardUtils {
        static caculateNumberValue(blackBoradComp: BlackboardComponent, op: EBBNumberOperation, key: string, value: number): boolean;
        static caculateStringValue(blackBoradComp: BlackboardComponent, op: EBBStringOperation, key: string, value: string): boolean;
        static caculateOtherValue(blackBoradComp: BlackboardComponent, op: EBBOtherOperation, key: string): boolean;
    }
    class BTCompositeSelector extends BTCompositeNode {
        getNextChildIndex(btCmp: BehaviorTreeComponent, preIndex: number, taskResult: EBTNodeResult): number;
    }
    class BTCompositeSequence extends BTCompositeNode {
        getNextChildIndex(btCmp: BehaviorTreeComponent, preIndex: number, taskResult: EBTNodeResult): number;
    }
    class BTSimpleParallel extends BTCompositeNode {
        finishMode: EBTFinishMode;
        getNextChildIndex(btCmp: BehaviorTreeComponent, preIndex: number, taskResult: EBTNodeResult): number;
        onLeave(btCmp: BehaviorTreeComponent): void;
        canAddSubTree(btCmp: BehaviorTreeComponent, childId: number): boolean;
        notifyChildExecution(btCmp: BehaviorTreeComponent, child: BTNode, result: EBTNodeResult): void;
        protected newContext(): BTSimpleParallelContext;
    }
    class BTSimpleParallelContext extends BTCompositeContext {
        isMainTaskActive: boolean;
        keepSubtask: boolean;
        reset(): void;
    }
    enum EBTFinishMode {
        Immediate = 0,
        Delayed = 1
    }
    class BehaviorTree {
        /**
         * 行为树根节点
         */
        rootNode: BTCompositeNode;
        /**
         * 黑板数据
         */
        blackboardAsset: BlackboardData;
        target: string;
        nodeMap: Map<any, BTExecutableNode>;
        constructor();
        parse(config: any): void;
        append(node: BTExecutableNode, item: any): void;
        getNodeById(id: any): BTExecutableNode;
    }
    class BehaviorTreeComponent extends Script implements ITickManger {
        /**
         * @private
         * 行为树列表 （包含子树）
         */
        list: BehaviorTreeInstance[];
        /**
         * @private
         * 执行上下文
         */
        excuteContext: BTExcuteContext;
        /**
         * 执行模式 是否循环
         */
        excutionMode: EBTExecutionMode;
        /**
         * 黑板组件
         */
        blackBoradComp: BlackboardComponent;
        /**
         * @private
         * 当前运行行为树的小标
         */
        activeID: number;
        /**@private */
        timer: Timer;
        constructor();
        /**@private */
        getCurrentTreeInstance(): BehaviorTreeInstance;
        /**@private */
        addParallelTask(task: BTTaskNode): void;
        /**@private */
        removeParallelTask(task: BTTaskNode): void;
        /**@private */
        startTree(bTree: BehaviorTree, excution?: EBTExecutionMode): void;
        /**@private */
        addInstance(bTree: BehaviorTree): boolean;
        /**@private */
        runNext(): void;
        /**@private */
        onTaskCall(task: BTTaskNode, result?: EBTNodeResult): boolean;
        /**@private */
        update(task: BTTaskNode, hasDebuggerPause?: boolean): void;
        /**@private */
        onTaskFinished(taskNode: BTTaskNode, taskResult: EBTNodeResult, isParalleTask: boolean): void;
        /**@private */
        nextFrame(): void;
        /**@private */
        executeTask(task: BTTaskNode): void;
    }
    class BTExcuteContext {
        target: string;
        exuteInstanceId: number;
        lastResult: EBTNodeResult;
        excuteNode: BTCompositeNode;
        childNext?: any;
    }
    class BehaviorTreeInstance {
        /**
         * 行为树根节点
         */
        rootNode: BTCompositeNode;
        /**
         * 当前激活节点
         */
        activeNode: BTNode;
        /**
         * 节点实例对象缓存Map
         */
        contextMap: Map<string, BTNodeContext>;
        nodeInstanceMap: Map<string, BTNode>;
        /**
         * 并行主任务
         */
        parallelTasks: BTTaskNode[];
        constructor();
        getContextNode(id: string): BTNodeContext;
        setContextNode(id: string, context: BTNodeContext): void;
        getNode(id: string): BTNode;
        setNode(id: string, node: BTNode): void;
        /**
         *
         * @param taskNode
         */
        addParallelTask(taskNode: BTTaskNode): void;
        /**
         *
         * @param taskNode
         */
        removeParallelTask(taskNode: BTTaskNode): void;
    }
    /**
     *
     * @ brief: BehaviorTreeUtil
     * @ author: zyh
     * @ data: 2024-03-21 10:49
     */
    class BehaviorTreeUtil {
        /**
        * hook
        * @param name
        * @param data
        */
        static addCustomData(name: string, data: any): void;
        static getDeclaration(name: string): any;
    }
    class BTAuxiliaryNode extends BTNode {
        protected _active: boolean;
        /**@private */
        childIndex: number;
        onActive(btCmp: BehaviorTreeComponent): void;
        onEnter(btCmp: BehaviorTreeComponent): void;
        onLeave(btCmp: BehaviorTreeComponent): void;
    }
    abstract class BTCompositeNode extends BTExecutableNode {
        children: BTNode[];
        private _isFirstRun;
        constructor();
        onEnter(btCmp: BehaviorTreeComponent): void;
        onActive(btCmp: BehaviorTreeComponent): void;
        onInactive(btCmp: BehaviorTreeComponent): void;
        onLeave(btCmp: BehaviorTreeComponent): void;
        canAddSubTree(btCmp: BehaviorTreeComponent, childId: number): boolean;
        addChild(node: BTNode): BTNode;
        parse(config: any): void;
        preCheck(preNode: BTNode, btCmp: BehaviorTreeComponent): BTNode;
        protected newContext(): BTCompositeContext;
        /**
         * 结束运行
         */
        onFinishExcute(btCmp: BehaviorTreeComponent): EBTNodeResult;
        private _checkLeave;
        private _checkInacitive;
        getNext(btCmp: BehaviorTreeComponent, excuteContext: BTExcuteContext, nodeContext: BTCompositeContext): number;
        /**
         * 执行子节点任务
         * @param btCmp
         * @param excuteContext
         * @returns
         */
        excute(btCmp: BehaviorTreeComponent, excuteContext: BTExcuteContext): BTNode;
        /**
         * 是否可以执行
         * @param btnode
         * @param btCmp
         * @returns
         */
        static canExcute(btnode: BTExecutableNode, btCmp: BehaviorTreeComponent): boolean;
        _onChildActive(node: BTNode, btCmp: BehaviorTreeComponent): void;
        abstract getNextChildIndex(btCmp: BehaviorTreeComponent, preIndex: number, taskResult: EBTNodeResult): number;
        notifyChildExecution(btCmp: BehaviorTreeComponent, child: BTNode, result: EBTNodeResult): void;
    }
    class BTCompositeContext extends BTNodeContext {
        curChild: number;
        forceToChild: number;
    }
    class BTConst {
        /**
         * 未初始化
         */
        static unInit: number;
        /**
         * 调出到父节点
         */
        static breakOut: number;
        static EXT: string;
        static TYPE: string;
        static configPath: string;
    }
    class BTDecorator extends BTAuxiliaryNode {
        /**@private */
        canExcute(btCmp: BehaviorTreeComponent): boolean;
        /**@private */
        isDecoratorObserverActive(): boolean;
        /**@private */
        isDecoratorExecutionActive(): boolean;
    }
    /**
     *
     * @ brief: BTExecutableNode
     * @ author: zyh
     * @ data: 2024-03-05 15:35
     */
    abstract class BTExecutableNode extends BTNode {
        decorators: BTDecorator[];
        services: BTService[];
        /**@private */
        hasDebugger: boolean;
        /**@private */
        onAdd(parentNode: BTCompositeNode): void;
        /**@private */
        onEnter(btCmp: BehaviorTreeComponent): void;
        /**@private */
        onActive(btCmp: BehaviorTreeComponent): void;
        /**@private */
        onLeave(btCmp: BehaviorTreeComponent): void;
        /**@private */
        addService(service: BTService): void;
        /**@private */
        addDecorator(decorator: BTDecorator): void;
        /**@private */
        preCheck(preNode: BTNode, btCmp: BehaviorTreeComponent): BTNode;
        /**@private */
        parse(config: TBTNode): void;
        /**@private */
        parseAuxiliary(config: TBTNode): void;
        /**@private */
        beginExcute(btCmp: BehaviorTreeComponent, excuteContext?: BTExcuteContext): boolean;
    }
    class BTNode implements IClone {
        /**@private */
        static ID: number;
        /**
         * 唯一标识
         */
        id: string;
        /**@private */
        nid: number;
        /**@private */
        parentNode: BTCompositeNode;
        name: string;
        /**@private */
        next: BTNode;
        /**@private */
        needCreate: boolean;
        /**@private */
        orignNode: BTNode;
        constructor();
        /**@private */
        parse(config: TBTNode): void;
        /**@private */
        onAdd(parentNode: BTCompositeNode): void;
        /**@private */
        setNext(next: BTNode): void;
        /**@private */
        preCheck(preNode: BTNode, btCmp: BehaviorTreeComponent): BTNode;
        /**@private */
        testTrace(): void;
        /**@private */
        createNodeContext(btCmp: BehaviorTreeComponent): void;
        /**@private */
        protected newContext(): BTNodeContext;
        /**@private */
        getNodeContext(btCmp: BehaviorTreeComponent): BTNodeContext;
        /**@private */
        getNodeInstance(btCmp: BehaviorTreeComponent): BTNode;
        /**@private */
        clone(): any;
        /**@private */
        cloneTo(destObject: any): void;
    }
    class BTNodeContext {
        id: string;
        nodeName: string;
    }
    class BTService extends BTAuxiliaryNode {
        isServerActive(): boolean;
    }
    class BTTaskNode extends BTExecutableNode {
        /**
         * 由于有可能任务节点需要重新new一个对象，有些只需要实例化一个数据区
         * @param btCmp
         * @returns
         */
        tryExcuteTask(btCmp: BehaviorTreeComponent): EBTNodeResult;
        /**@private */
        excuteTask(btCmp: BehaviorTreeComponent): EBTNodeResult;
        /**@private */
        finishLatentTask(btCmp: BehaviorTreeComponent, taskResult: EBTNodeResult): void;
        onTaskFinished(btCmp: BehaviorTreeComponent, taskResult: EBTNodeResult): void;
        /**@private */
        parse(config: any): void;
        protected newContext(): BTTaskNodeContext;
        onEnter(btCmp: BehaviorTreeComponent): void;
        onActive(btCmp: BehaviorTreeComponent): void;
        onInactive(btCmp: BehaviorTreeComponent): void;
        /**@private */
        isTaskExecuting(): boolean;
        /**@private */
        isTaskAborting(): boolean;
    }
    class BTTaskNodeContext extends BTNodeContext {
    }
    enum EBTExecutionMode {
        SingleRun = 0,
        Looped = 1
    }
    enum EBTNodeResult {
        InProgress = 0,
        Succeeded = 1,
        Failed = 2,
        Aborted = 3
    }
    interface ITickManger {
        nextFrame(): void;
    }
    /**
     * 开发者自定义相关
     */
    const customBTData: Record<string, any>;
    const extendsBTData: Record<string, any>;
    enum BTType {
        Wait = "BTTaskWait",
        Test = "BTTaskTest",
        Loop = "BTLoop",
        Parallel = "SimpleParallel",
        Selector = "Selector",
        Sequence = "Sequence",
        Cooldown = "BTCooldown",
        BlackBorad = "BTBlackBorad",
        RunBehavior = "BTTaskRunBehavior",
        ForceSuccess = "BTForceSuccess",
        ConditionalLoop = "BTConditionalLoop",
        FinishWithResult = "BTTaskFinishWithResult",
        CompareBBEntries = "BTCompareBBEntries"
    }
    interface TBTNode {
        /** 数据唯一的id号*/
        id: number;
        ver?: number;
        /**dispatcher的名字 */
        /**当前的类 */
        target?: string;
        name?: string;
        /** constData的id号 */
        cid: BTType;
        /**var或者event的id */
        dataId?: string;
        customId?: number;
        /**所有UI所用到的数据 */
        uiData?: {
            /**数据的x坐标位置 */
            x: number;
            /**数据的y坐标位置 */
            y: number;
            /**函数注释 */
            desc?: any;
            /**是否隐藏 */
            isHidden?: boolean;
            /**是否显示desc的气泡 */
            isShowDesc?: boolean;
        };
        childs?: string[];
        debugType?: number;
        decorator?: TBTDecorator[];
        service?: TBTService[];
        autoReg?: boolean;
        props?: Record<string, any>;
    }
    interface TBTDecorator {
        id: number;
        cid: string;
    }
    interface TBTService {
        id: number;
        cid: string;
    }
    class BTBlackBorad extends BTDecorator {
        keyName: string;
        op: number;
        value: any;
        canExcute(btCmp: BehaviorTreeComponent): boolean;
    }
    /**
     *
     * @ brief: BTCompareBBEntries
     * @ author: zyh
     * @ data: 2024-03-06 10:27
     */
    class BTCompareBBEntries extends BTDecorator {
        op: EBBNumberOperation.equal | EBBNumberOperation.notEqual;
        keyNameA: string;
        keyNameB: string;
        canExcute(btCmp: BehaviorTreeComponent): boolean;
    }
    /**
     *
     * @ brief: BTConditionalLoop
     * @ author: zyh
     * @ data: 2024-03-06 11:06
     */
    class BTConditionalLoop extends BTLoop {
        op: EBBOtherOperation;
        keyName: string;
        canExcute(btCmp: BehaviorTreeComponent): boolean;
    }
    /**
     *
     * @ brief: BTCooldown
     * @ author: zyh
     * @ data: 2024-03-06 11:07
     */
    class BTCooldown extends BTDecorator {
        time: number;
        isCooldown: boolean;
        canExcute(btCmp: BehaviorTreeComponent): boolean;
    }
    /**
     *
     * @ brief: BTDecoratorBluePrintBase
     * @ author: zyh
     * @ data: 2024-03-06 11:09
     */
    class BTDecoratorBluePrintBase extends BTDecorator {
        result: boolean;
        constructor();
        /**@private */
        canExcute(btCmp: BehaviorTreeComponent): boolean;
        onCheck(btCmp: BehaviorTreeComponent): void;
    }
    /**
     *
     * @ brief: BTForceSuccess
     * @ author: zyh
     * @ data: 2024-03-06 11:10
     */
    class BTForceSuccess extends BTDecorator {
        canExcute(btCmp: BehaviorTreeComponent): boolean;
    }
    class BTLoop extends BTDecorator {
        loopCount: number;
        protected newContext(): BTLoopContext;
        onActive(btCmp: BehaviorTreeComponent): void;
        onLeave(btCmp: BehaviorTreeComponent): void;
    }
    class BTLoopContext extends BTNodeContext {
        remaining: number;
    }
    /**
     *
     * @ brief: BTServiceBluePrintBase
     * @ author: zyh
     * @ data: 2024-03-06 11:14
     */
    class BTServiceBluePrintBase extends BTService {
        constructor();
        onEnter(btCmp: BehaviorTreeComponent): void;
        onLeave(btCmp: BehaviorTreeComponent): void;
    }
    class TestService extends BTService {
        onEnter(btCmp: BehaviorTreeComponent): void;
        onLeave(btCmp: BehaviorTreeComponent): void;
    }
    class BTTaskBluePrintBase extends BTTaskNode {
        /**
         * @private
         */
        currentResult: EBTNodeResult;
        /**
         * @private
         */
        isRuning: boolean;
        /**
         * @private
         */
        myCMP: BehaviorTreeComponent;
        constructor();
        onReciecve?<T extends Node>(owner: T): void;
        /**
         * 获取黑板数据
         * @returns
         */
        getOwnersBlackBoard(): BlackboardComponent;
        /**
         * @private
         * @param btCmp
         * @returns
         */
        excuteTask(btCmp: BehaviorTreeComponent): EBTNodeResult;
        finishWithResult(result: EBTNodeResult): void;
    }
    class BTTaskFinishWithResult extends BTTaskNode {
        result: EBTNodeResult;
        constructor();
        excuteTask(btCmp: BehaviorTreeComponent): EBTNodeResult;
    }
    class BTTaskRunBehavior extends BTTaskNode {
        btTree: BehaviorTree;
        excuteTask(btCmp: BehaviorTreeComponent): EBTNodeResult;
    }
    class BTTaskTest extends BTTaskNode {
        excuteTask(btCmp: BehaviorTreeComponent): EBTNodeResult;
    }
    class BTTaskWait extends BTTaskNode {
        waitTime: number;
        excuteTask(btCmp: BehaviorTreeComponent): EBTNodeResult;
        protected newContext(): BTTaskWaitContext;
    }
    class BTTaskWaitContext extends BTTaskNodeContext {
        onFinish(btCmp: BehaviorTreeComponent, task: BTTaskWait): void;
    }
    class TestBPTask extends BTTaskBluePrintBase {
        onReciecve(): void;
    }
    class TestBT {
        constructor();
        createBlackBoard(): BlackboardData;
        createSubTree(bb: BlackboardData): BehaviorTree;
        /**
         *                             Sequence
         *                            /    |   \            \
         *                           /     |    \              \
         *                          /      |     \               \
         *                       (loop)
         *                       selector wait2 bpreturnfalse    bpreturntrue
         *                      (service)
         *                     /    |   \
         *                    /     |    \
         *                   /      |     \
         *        bpreturnfalse1   (loop)   wait1
         *                       bpreturntrue1
         *                        (service)
         * @param bb
         * @returns
         */
        createSimpleCompose(bb: BlackboardData): BehaviorTree;
        /**
         *               Sequence
         *            /     |        \          \
         *          wait1 runBehaior runBPTask  runTest
         * @returns
         */
        createSimpleTree(bb: BlackboardData): BehaviorTree;
        createSimpleTree2(bb: BlackboardData): BehaviorTree;
    }
}
