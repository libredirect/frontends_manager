var d=Object.defineProperty;var e=(c,a)=>{for(var b in a)d(c,b,{get:a[b],enumerable:!0});};

var f$1={};e(f$1,{convertFileSrc:()=>w$1,invoke:()=>c$2,transformCallback:()=>s$2});function u$2(){return window.crypto.getRandomValues(new Uint32Array(1))[0]}function s$2(e,r=!1){let n=u$2(),t=`_${n}`;return Object.defineProperty(window,t,{value:o=>(r&&Reflect.deleteProperty(window,t),e==null?void 0:e(o)),writable:!1,configurable:!0}),n}async function c$2(e,r={}){return new Promise((n,t)=>{let o=s$2(i=>{n(i),Reflect.deleteProperty(window,`_${a}`);},!0),a=s$2(i=>{t(i),Reflect.deleteProperty(window,`_${o}`);},!0);window.__TAURI_IPC__({cmd:e,callback:o,error:a,...r});})}function w$1(e,r="asset"){let n=encodeURIComponent(e);return navigator.userAgent.includes("Windows")?`https://${r}.localhost/${n}`:`${r}://localhost/${n}`}

async function a(i){return c$2("tauri",i)}

var W$1={};e(W$1,{TauriEvent:()=>c$1,emit:()=>D,listen:()=>E$1,once:()=>_});async function s$1(n,t){return a({__tauriModule:"Event",message:{cmd:"unlisten",event:n,eventId:t}})}async function m$1(n,t,i){await a({__tauriModule:"Event",message:{cmd:"emit",event:n,windowLabel:t,payload:i}});}async function o$1(n,t,i){return a({__tauriModule:"Event",message:{cmd:"listen",event:n,windowLabel:t,handler:s$2(i)}}).then(r=>async()=>s$1(n,r))}async function u$1(n,t,i){return o$1(n,t,r=>{i(r),s$1(n,r.id).catch(()=>{});})}var c$1=(e=>(e.WINDOW_RESIZED="tauri://resize",e.WINDOW_MOVED="tauri://move",e.WINDOW_CLOSE_REQUESTED="tauri://close-requested",e.WINDOW_CREATED="tauri://window-created",e.WINDOW_DESTROYED="tauri://destroyed",e.WINDOW_FOCUS="tauri://focus",e.WINDOW_BLUR="tauri://blur",e.WINDOW_SCALE_FACTOR_CHANGED="tauri://scale-change",e.WINDOW_THEME_CHANGED="tauri://theme-changed",e.WINDOW_FILE_DROP="tauri://file-drop",e.WINDOW_FILE_DROP_HOVER="tauri://file-drop-hover",e.WINDOW_FILE_DROP_CANCELLED="tauri://file-drop-cancelled",e.MENU="tauri://menu",e.CHECK_UPDATE="tauri://update",e.UPDATE_AVAILABLE="tauri://update-available",e.INSTALL_UPDATE="tauri://update-install",e.STATUS_UPDATE="tauri://update-status",e.DOWNLOAD_PROGRESS="tauri://update-download-progress",e))(c$1||{});async function E$1(n,t){return o$1(n,null,t)}async function _(n,t){return u$1(n,null,t)}async function D(n,t){return m$1(n,void 0,t)}

var C={};e(C,{CloseRequestedEvent:()=>y,LogicalPosition:()=>c,LogicalSize:()=>m,PhysicalPosition:()=>o,PhysicalSize:()=>l,UserAttentionType:()=>W,WebviewWindow:()=>s,WebviewWindowHandle:()=>u,WindowManager:()=>h,appWindow:()=>b,availableMonitors:()=>T,currentMonitor:()=>E,getAll:()=>M,getCurrent:()=>f,primaryMonitor:()=>z});var m=class{constructor(e,a){this.type="Logical";this.width=e,this.height=a;}},l=class{constructor(e,a){this.type="Physical";this.width=e,this.height=a;}toLogical(e){return new m(this.width/e,this.height/e)}},c=class{constructor(e,a){this.type="Logical";this.x=e,this.y=a;}},o=class{constructor(e,a){this.type="Physical";this.x=e,this.y=a;}toLogical(e){return new c(this.x/e,this.y/e)}},W=(a=>(a[a.Critical=1]="Critical",a[a.Informational=2]="Informational",a))(W||{});function f(){return new s(window.__TAURI_METADATA__.__currentWindow.label,{skip:!0})}function M(){return window.__TAURI_METADATA__.__windows.map(i=>new s(i.label,{skip:!0}))}var P=["tauri://created","tauri://error"],u=class{constructor(e){this.label=e,this.listeners=Object.create(null);}async listen(e,a){return this._handleTauriEvent(e,a)?Promise.resolve(()=>{let n=this.listeners[e];n.splice(n.indexOf(a),1);}):o$1(e,this.label,a)}async once(e,a){return this._handleTauriEvent(e,a)?Promise.resolve(()=>{let n=this.listeners[e];n.splice(n.indexOf(a),1);}):u$1(e,this.label,a)}async emit(e,a){if(P.includes(e)){for(let n of this.listeners[e]||[])n({event:e,id:-1,windowLabel:this.label,payload:a});return Promise.resolve()}return m$1(e,this.label,a)}_handleTauriEvent(e,a){return P.includes(e)?(e in this.listeners?this.listeners[e].push(a):this.listeners[e]=[a],!0):!1}},h=class extends u{async scaleFactor(){return a({__tauriModule:"Window",message:{cmd:"manage",data:{label:this.label,cmd:{type:"scaleFactor"}}}})}async innerPosition(){return a({__tauriModule:"Window",message:{cmd:"manage",data:{label:this.label,cmd:{type:"innerPosition"}}}}).then(({x:e,y:a})=>new o(e,a))}async outerPosition(){return a({__tauriModule:"Window",message:{cmd:"manage",data:{label:this.label,cmd:{type:"outerPosition"}}}}).then(({x:e,y:a})=>new o(e,a))}async innerSize(){return a({__tauriModule:"Window",message:{cmd:"manage",data:{label:this.label,cmd:{type:"innerSize"}}}}).then(({width:e,height:a})=>new l(e,a))}async outerSize(){return a({__tauriModule:"Window",message:{cmd:"manage",data:{label:this.label,cmd:{type:"outerSize"}}}}).then(({width:e,height:a})=>new l(e,a))}async isFullscreen(){return a({__tauriModule:"Window",message:{cmd:"manage",data:{label:this.label,cmd:{type:"isFullscreen"}}}})}async isMaximized(){return a({__tauriModule:"Window",message:{cmd:"manage",data:{label:this.label,cmd:{type:"isMaximized"}}}})}async isDecorated(){return a({__tauriModule:"Window",message:{cmd:"manage",data:{label:this.label,cmd:{type:"isDecorated"}}}})}async isResizable(){return a({__tauriModule:"Window",message:{cmd:"manage",data:{label:this.label,cmd:{type:"isResizable"}}}})}async isVisible(){return a({__tauriModule:"Window",message:{cmd:"manage",data:{label:this.label,cmd:{type:"isVisible"}}}})}async theme(){return a({__tauriModule:"Window",message:{cmd:"manage",data:{label:this.label,cmd:{type:"theme"}}}})}async center(){return a({__tauriModule:"Window",message:{cmd:"manage",data:{label:this.label,cmd:{type:"center"}}}})}async requestUserAttention(e){let a$1=null;return e&&(e===1?a$1={type:"Critical"}:a$1={type:"Informational"}),a({__tauriModule:"Window",message:{cmd:"manage",data:{label:this.label,cmd:{type:"requestUserAttention",payload:a$1}}}})}async setResizable(e){return a({__tauriModule:"Window",message:{cmd:"manage",data:{label:this.label,cmd:{type:"setResizable",payload:e}}}})}async setTitle(e){return a({__tauriModule:"Window",message:{cmd:"manage",data:{label:this.label,cmd:{type:"setTitle",payload:e}}}})}async maximize(){return a({__tauriModule:"Window",message:{cmd:"manage",data:{label:this.label,cmd:{type:"maximize"}}}})}async unmaximize(){return a({__tauriModule:"Window",message:{cmd:"manage",data:{label:this.label,cmd:{type:"unmaximize"}}}})}async toggleMaximize(){return a({__tauriModule:"Window",message:{cmd:"manage",data:{label:this.label,cmd:{type:"toggleMaximize"}}}})}async minimize(){return a({__tauriModule:"Window",message:{cmd:"manage",data:{label:this.label,cmd:{type:"minimize"}}}})}async unminimize(){return a({__tauriModule:"Window",message:{cmd:"manage",data:{label:this.label,cmd:{type:"unminimize"}}}})}async show(){return a({__tauriModule:"Window",message:{cmd:"manage",data:{label:this.label,cmd:{type:"show"}}}})}async hide(){return a({__tauriModule:"Window",message:{cmd:"manage",data:{label:this.label,cmd:{type:"hide"}}}})}async close(){return a({__tauriModule:"Window",message:{cmd:"manage",data:{label:this.label,cmd:{type:"close"}}}})}async setDecorations(e){return a({__tauriModule:"Window",message:{cmd:"manage",data:{label:this.label,cmd:{type:"setDecorations",payload:e}}}})}async setAlwaysOnTop(e){return a({__tauriModule:"Window",message:{cmd:"manage",data:{label:this.label,cmd:{type:"setAlwaysOnTop",payload:e}}}})}async setSize(e){if(!e||e.type!=="Logical"&&e.type!=="Physical")throw new Error("the `size` argument must be either a LogicalSize or a PhysicalSize instance");return a({__tauriModule:"Window",message:{cmd:"manage",data:{label:this.label,cmd:{type:"setSize",payload:{type:e.type,data:{width:e.width,height:e.height}}}}}})}async setMinSize(e){if(e&&e.type!=="Logical"&&e.type!=="Physical")throw new Error("the `size` argument must be either a LogicalSize or a PhysicalSize instance");return a({__tauriModule:"Window",message:{cmd:"manage",data:{label:this.label,cmd:{type:"setMinSize",payload:e?{type:e.type,data:{width:e.width,height:e.height}}:null}}}})}async setMaxSize(e){if(e&&e.type!=="Logical"&&e.type!=="Physical")throw new Error("the `size` argument must be either a LogicalSize or a PhysicalSize instance");return a({__tauriModule:"Window",message:{cmd:"manage",data:{label:this.label,cmd:{type:"setMaxSize",payload:e?{type:e.type,data:{width:e.width,height:e.height}}:null}}}})}async setPosition(e){if(!e||e.type!=="Logical"&&e.type!=="Physical")throw new Error("the `position` argument must be either a LogicalPosition or a PhysicalPosition instance");return a({__tauriModule:"Window",message:{cmd:"manage",data:{label:this.label,cmd:{type:"setPosition",payload:{type:e.type,data:{x:e.x,y:e.y}}}}}})}async setFullscreen(e){return a({__tauriModule:"Window",message:{cmd:"manage",data:{label:this.label,cmd:{type:"setFullscreen",payload:e}}}})}async setFocus(){return a({__tauriModule:"Window",message:{cmd:"manage",data:{label:this.label,cmd:{type:"setFocus"}}}})}async setIcon(e){return a({__tauriModule:"Window",message:{cmd:"manage",data:{label:this.label,cmd:{type:"setIcon",payload:{icon:typeof e=="string"?e:Array.from(e)}}}}})}async setSkipTaskbar(e){return a({__tauriModule:"Window",message:{cmd:"manage",data:{label:this.label,cmd:{type:"setSkipTaskbar",payload:e}}}})}async setCursorGrab(e){return a({__tauriModule:"Window",message:{cmd:"manage",data:{label:this.label,cmd:{type:"setCursorGrab",payload:e}}}})}async setCursorVisible(e){return a({__tauriModule:"Window",message:{cmd:"manage",data:{label:this.label,cmd:{type:"setCursorVisible",payload:e}}}})}async setCursorIcon(e){return a({__tauriModule:"Window",message:{cmd:"manage",data:{label:this.label,cmd:{type:"setCursorIcon",payload:e}}}})}async setCursorPosition(e){if(!e||e.type!=="Logical"&&e.type!=="Physical")throw new Error("the `position` argument must be either a LogicalPosition or a PhysicalPosition instance");return a({__tauriModule:"Window",message:{cmd:"manage",data:{label:this.label,cmd:{type:"setCursorPosition",payload:{type:e.type,data:{x:e.x,y:e.y}}}}}})}async setIgnoreCursorEvents(e){return a({__tauriModule:"Window",message:{cmd:"manage",data:{label:this.label,cmd:{type:"setIgnoreCursorEvents",payload:e}}}})}async startDragging(){return a({__tauriModule:"Window",message:{cmd:"manage",data:{label:this.label,cmd:{type:"startDragging"}}}})}async onResized(e){return this.listen("tauri://resize",e)}async onMoved(e){return this.listen("tauri://move",e)}async onCloseRequested(e){return this.listen("tauri://close-requested",a=>{let n=new y(a);Promise.resolve(e(n)).then(()=>{if(!n.isPreventDefault())return this.close()});})}async onFocusChanged(e){let a=await this.listen("tauri://focus",d=>{e({...d,payload:!0});}),n=await this.listen("tauri://blur",d=>{e({...d,payload:!1});});return ()=>{a(),n();}}async onScaleChanged(e){return this.listen("tauri://scale-change",e)}async onMenuClicked(e){return this.listen("tauri://menu",e)}async onFileDropEvent(e){let a=await this.listen("tauri://file-drop",r=>{e({...r,payload:{type:"drop",paths:r.payload}});}),n=await this.listen("tauri://file-drop-hover",r=>{e({...r,payload:{type:"hover",paths:r.payload}});}),d=await this.listen("tauri://file-drop-cancelled",r=>{e({...r,payload:{type:"cancel"}});});return ()=>{a(),n(),d();}}async onThemeChanged(e){return this.listen("tauri://theme-changed",e)}},y=class{constructor(e){this._preventDefault=!1;this.event=e.event,this.windowLabel=e.windowLabel,this.id=e.id;}preventDefault(){this._preventDefault=!0;}isPreventDefault(){return this._preventDefault}},s=class extends h{constructor(e,a$1={}){super(e),a$1!=null&&a$1.skip||a({__tauriModule:"Window",message:{cmd:"createWebview",data:{options:{label:e,...a$1}}}}).then(async()=>this.emit("tauri://created")).catch(async n=>this.emit("tauri://error",n));}static getByLabel(e){return M().some(a=>a.label===e)?new s(e,{skip:!0}):null}},b;"__TAURI_METADATA__"in window?b=new s(window.__TAURI_METADATA__.__currentWindow.label,{skip:!0}):(console.warn(`Could not find "window.__TAURI_METADATA__". The "appWindow" value will reference the "main" window label.
Note that this is not an issue if running this frontend on a browser instead of a Tauri window.`),b=new s("main",{skip:!0}));function g(i){return i===null?null:{name:i.name,scaleFactor:i.scaleFactor,position:new o(i.position.x,i.position.y),size:new l(i.size.width,i.size.height)}}async function E(){return a({__tauriModule:"Window",message:{cmd:"manage",data:{cmd:{type:"currentMonitor"}}}}).then(g)}async function z(){return a({__tauriModule:"Window",message:{cmd:"manage",data:{cmd:{type:"primaryMonitor"}}}}).then(g)}async function T(){return a({__tauriModule:"Window",message:{cmd:"manage",data:{cmd:{type:"availableMonitors"}}}}).then(i=>i.map(g))}

const w = b;
async function unwatch(id) {
    await c$2("plugin:fs-watch|unwatch", { id });
}
async function watch(paths, cb, options = {}) {
    const opts = {
        recursive: false,
        delayMs: 2000,
        ...options,
    };
    let watchPaths;
    if (typeof paths === "string") {
        watchPaths = [paths];
    }
    else {
        watchPaths = paths;
    }
    const id = window.crypto.getRandomValues(new Uint32Array(1))[0];
    await c$2("plugin:fs-watch|watch", {
        id,
        paths: watchPaths,
        options: opts,
    });
    const unlisten = await w.listen(`watcher://debounced-event/${id}`, (event) => {
        cb(event.payload);
    });
    return () => {
        void unwatch(id);
        unlisten();
    };
}
async function watchImmediate(paths, cb, options = {}) {
    const opts = {
        recursive: false,
        ...options,
        delayMs: null,
    };
    let watchPaths;
    if (typeof paths === "string") {
        watchPaths = [paths];
    }
    else {
        watchPaths = paths;
    }
    const id = window.crypto.getRandomValues(new Uint32Array(1))[0];
    await c$2("plugin:fs-watch|watch", {
        id,
        paths: watchPaths,
        options: opts,
    });
    const unlisten = await w.listen(`watcher://raw-event/${id}`, (event) => {
        cb(event.payload);
    });
    return () => {
        void unwatch(id);
        unlisten();
    };
}

export { watch, watchImmediate };
//# sourceMappingURL=index.min.js.map
