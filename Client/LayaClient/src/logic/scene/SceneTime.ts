// jojohello 2023/05/22 
// 这里是场景开始后经过得时间，整个场景得时间都用这个时间，方便做time scale，暂停等功能
// scene在update的时候把这个时间一路往下传递，每个子模块，如果需要update，也尽量带上时间参数

// 注意，当切换到后台的时候，记住暂停时间

class SceneTime {
    private startTime: number = 0;
    private timeScale: number = 1;
    private passTime: number = 0;
  
    public start(): void {
        this.startTime = new Date().getTime();
        this.timeScale = 1;
        this.passTime = 0;
    }
  
    public setScale(scale: number): void {
        if (scale < 0) {
            return;
        }
    
        if (this.timeScale == scale) {
            return;
        }
  
        let curTime = new Date().getTime();
        this.passTime = this.passTime + (curTime - this.startTime) * this.timeScale;
        this.startTime = curTime;
        this.timeScale = scale;
    }
    
    private oldScale = 0;
    public pause(): void {
        if(this.timeScale <= 0)
            return;

        this.oldScale = this.timeScale;
        this.setScale(0);
    }

    public resume(): void {
        if(this.oldScale <= 0)
            return;

        this.setScale(this.oldScale);
    }
    
    public curTime(): number {
        let curTime = new Date().getTime();
        return this.passTime + (curTime - this.startTime) * this.timeScale;
    }
}
  
export default SceneTime;