function effect(fn, options = {}) {
    const effectFn = () => {
        cleanup(effectFn);
        activeEffect = effectFn;
        effectStack.push(effectFn);
        const res = fn();
        effectStack.pop();
        activeEffect = effectStack[effectStack.length - 1];
        return res;
    };
    effectFn.options = options;
    effectFn.deps = [];
    if (!options.lazy) {
        effectFn();
    }
    return effectFn;
}

const effectFn = effect(
    () => {
        obj.foo + obj.bar;
    },
    { lazy: true }
);
const value = effectFn();

/* ------------------------------computed计算属性------------------------------ */
function computed(getter) {
    let value; //缓存上一次计算的值
    let dirty = true; //是否重新计算

    //把getter作为副作用函数，创建一个lazy的effect
    const effectFn = effect(getter, {
        lazy: true,
        scheduler() {
            if (!dirty) {
                dirty = true;
                //当计算属性所依赖的响应式数据变化时，手动调用trigger函数触发响应
                trigger(obj, "value");
            }
        },
    });

    const obj = {
        //读取value时才执行effectFn
        get value() {
            if (dirty) {
                value = effectFn();
                dirty = false;
            }
            //当读取value时，手动调用track函数进行追踪
            TrackEvent(obj, "value");
            return value;
        },
    };
    return obj;
}

const data = { foo: 1, bar: 2 };
const obj = new Proxy(data, {
    /* ... */
});
const sumRes = computed(() => obj.foo + obj.bar);
console.log(sumRes.value);

/* ------------------------------watch------------------------------ */
//本质是观测一个响应式数据，相当于二次封装effect，当数据发生变化时通知并执行相应的回调函数
function watch(source, cb) {
    effect(
        //触发读取操作，从而建立联系
        () => traverse(source), //递归读取
        {
            scheduler() {
                cb(); //数据变化时，callback
            },
        }
    );
}

function traverse(value, seen = new Set()) {
    if (typeof value !== "object" || value === null || seen.has(value)) {
        return;
    }
    seen.add(value);
    for (const k in value) {
        traverse(value[k], seen);
    }
    return value;
}

const data = { foo: 1 };
const obj = new Proxy(data, {
    /* ... */
});

watch(obj, () => {
    console.log("data changed");
});
obj.foo++;

//------------watch除观测响应式数据，还可以接受一个getter函数
function watch(source, cb) {
    let getter;
    if (typeof source === "function") {
        getter = source;
    } else {
        getter = traverse(source);
    }

    let oldValue, newValue;
    const effectFn = effect(
        () => getter(),

        {
            lazy: true,
            scheduler() {
                newValue = effectFn();
                cb(newValue, oldValue);
            },
        }
    );
    oldValue = effectFn();
}

/* ------------------------------立即执行的watch与回调执行时机------------------------------ */
function watch(source, cb, options = {}) {
    let getter;
    if (typeof source === "function") {
        getter = source;
    } else {
        getter = () => traverse(source);
    }
    let oldValue, newValue;

    //提取scheduler调度函数为一个独立的job函数
    const job = () => {
        newValue = effectFn();
        cb(newValue, oldValue);
        oldValue = newValue;
    };

    const effectFn = effect(() => getter(), {
        lazy: true,
        scheduler: job,
    });

    if (options.immediate) {
        job();
    } else {
        oldValue = effectFn();
    }
}

/* ------------------------------过期的副作用------------------------------ */

function watch(source, cb, options = {}) {
    let getter;
    if (typeof source === "function") {
        getter = source;
    } else {
        getter = () => traverse(source);
    }
    let oldValue, newValue;

    let cleanup;
    function onInvalidate(fn) {
        cleanup = fn; //将过期的回调存储在cleanup中
    }

    const job = () => {
        newValue = effectFn();
        //在调用cb之前，先调用过期回调
        if (cleanup) {
            cleanup();
        }
        cb(newValue, oldValue, onInvalidate);
        oldValue = newValue;
    };

    const effectFn = effect(() => getter(), {
        lazy: true,
        scheduler: () => {
            if (options.flush === "post") {
                const p = Promise.resolve();
                p.then(job);
            } else {
                job();
            }
        },
    });

    if (options.immediate) {
        job();
    } else {
        oldValue = effectFn();
    }
}

watch(obj, async (newValue, oldValue, onInvalidate) => {
    let expired = false;
    //使用onInvalidate函数注册一个回调，这个回调在当前副作用函数过期时执行
    onInvalidate(() => {
        expired = true;
    });

    const res = await fetch("/path/to/request");

    if (!expired) {
        finalData = res;
    }
});

obj.foo++;
setTimeout(() => {
    obj.foo++;
}, 200);
