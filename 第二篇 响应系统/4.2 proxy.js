//存储副作用函数
const bucket = new WeakMap();

//原始数据
const data = { text: "hello" };
//代理
const obj = new Proxy(data, {
    get(target, key) {
        if (!activeEffect) {
            return target[key];
        }
        //deps=dependencies
        let depsMap = bucket.get(target);
        if (!depsMap) {
            bucket.set(target, (depsMap = new Map()));
        }
        let deps = depsMap.get(key);
        if (!deps) {
            depsMap.set(key, (deps = new Set()));
        }
        deps.add(activeEffect);
        return target[key];
    },
    set(target, key, newVal) {
        target[key] = newVal;
        const depsMap = bucket.get(target);
        if (!depsMap) {
            return;
        }
        const effects = depsMap.get(key);
        effects && effects.forEach(fn => fn());
    },
});

let activeEffect; //全局变量存储副作用函数
function effect(fn) {
    //注册副作用函数
    activeEffect = fn;
    fn();
}

effect(
    //匿名副作用函数
    () => {
        console.log("effect run");
        document.body.innerText = obj.text;
    }
);
setTimeout(() => {
    obj.text = "hello world";
}, 1000);

/* -------------------------封装 + 分支切换clean up + 解决effect嵌套与无限递归循环 + 调度执行------------------------- */
let activeEffect;
const effectStack = [];
function effect(fn, options = {}) {
    const effectFn = () => {
        cleanup(effectFn);
        activeEffect = effectFn;
        effectStack.push(effectFn);
        fn();
        effectStack.pop();
        activeEffect = effectStack[effectStack.length - 1];
    };
    effectFn.options = options;
    effectFn.deps = []; //存储与该副作用函数相关联的依赖集合
    effectFn();
}

function cleanup(effectFn) {
    for (let i = 0; i < effectFn.deps.length; i++) {
        const deps = effectFn.deps[i];
        deps.delete(effectFn);
    }
    effectFn.deps.length = 0;
}

const obj = new Proxy(data, {
    get(target, key) {
        track(target, key);
        return target[key];
    },
    set(target, key, newVal) {
        target[key] = newVal;
        trigger(target, key);
    },
});

function track(target, key) {
    if (!activeEffect) {
        return;
    }
    let depsMap = bucket.get(target);
    if (!depsmap) {
        bucket.set(target, (depsMap = new Map()));
    }
    let deps = depsMap.get(key);
    if (!deps) {
        depsMap.set(key, (deps = new Set()));
    }
    deps.add(activeEffect);
    activeEffect.deps.push(deps);
}

function trigger(target, key) {
    const depsMap = bucket.get(target);
    if (!depsMap) {
        return;
    }
    const effects = depsMap.get(key);

    const effectsToRun = new Set();
    effects &&
        effects.forEach(effectFn => {
            if (effectFn !== activeEffect) {
                //若trigger触发执行的副作用函数与当前正在执行的副作用函数相同，则不触发执行
                effectsToRun.add(effectFn);
            }
        });
    effectsToRun.forEach(effectFn => {
        //如果一个副作用函数存在调度器，则调用它，并将副作用函数作为参数传递
        if (effectFn.options.scheduler) {
            effectFn.options.scheduler(effectFn);
        } else {
            effectFn();
        }
    });
}

const data = { foo: 1 };
const obj = new Proxy(data, {
    /*...*/
});

//连续多次修改响应式数据只触发一次更新
const jobQueue = new Set();
const p = Promise.resolve();
let isFlushing = false;
function flushJob() {
    if (isFlushing) {
        return;
    }
    isFlushing = true;
    p.then(() => {
        jobQueue.forEach(job => job());
    }).finally(() => {
        isFlushing = false;
    });
}

effect(
    () => {
        console.log(obj.foo);
    },
    {
        scheduler(fn) {
            jobQueue.add(fn);
            flushJob(); //刷新队列
        },
    }
);
obj.foo++;
obj.foo++;
console.log("end");
