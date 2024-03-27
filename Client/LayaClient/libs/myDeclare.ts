// jojohello 2023-9-6 自己编写的声明，用来声明放到Laya目录下的东西，以免文件报错
declare module Laya 
{
    type EventHandler = (...args: any[]) => void;

    class EventEmitter {
        static get inst(): EventEmitter;
        on(eventName: number, handler: EventHandler): void;
        off(eventName: number, handler: EventHandler): void;
        emit(eventName: number, ...args: any[]): void;
    }
}

declare module 'jszip' {
    class JSZip {
      constructor();
      loadAsync(data: any, options:{}): Promise<JSZip>;
      file(name: string): JSZip.JSZipObject | null;
      forEach(callback: any, thisArg?: any): void;

      files: any;
    }
  
    namespace JSZip {
      interface JSZipObject {
        async(type: string): Promise<any>;
      }
    }
  
    export = JSZip;
  }