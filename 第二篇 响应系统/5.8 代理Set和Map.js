const reactiveMap = new Map();
function reactive(obj) {
    const proxy = createReactive(obj);
    const existionProxy = reactiveMap.get(obj);
    if (existionProxy) {
        return existionProxy;
        reactiveMap.set(obj, proxy);
    }
    return proxy;
}

function createReactive(obj, isShallow = false, isReadonly = false) {
    return new Proxy(obj, {
        get(target, key, receiver) {
            if (key === "raw") {
                return target;
            }
            if (key === "size") {
                track(target, ITERATE_KEY);
                return Reflect.get(target, key, target); //指定第三个参数receiver为原始对象target
            }
            //return target[key].bind(target);
            return mutableInstrumentations[key];
        },
    });
}

const mutableInstrumentations = {
    add(key) {
        const target = this.raw; //this指向代理对象，通过raw获取原始数据对象
        const hadKey = target.has(key);
        if (!hadKey) {
            const res = target.add(key);
            trigger(target, key, "ADD");
        }
        return res;
    },
    delete(key) {
        const target = this.raw;
        const hadKey = target.has(key);
        if (hadKey) {
            const res = target.delete(key);
            trigger(target, key, "DELETE");
        }
        return res;
    },

    get(key) {
        const target = this.raw;
        const had = target.has(key);
        track(target, key);
        if (had) {
            const res = target.get(key);
            return typeof res === "object" ? reactive(res) : res;
        }
    },

    set(key, value) {
        const target = this.raw;
        const had = target.has(key);

        const oldValue = target.get(key);
        const rawValue = value.raw || value;
        target.set(key, rawValue);
        if (!had) {
            trigger(target, key, "ADD");
        } else if (
            oldValue !== value ||
            (oldValue === oldValue && value === value)
        ) {
            trigget(target, key, "SET");
        }
    },

    forEach(callback, thisArg) {
        const wrap = val => (typeof val === "object" ? reactive(val) : val);
        const target = this.raw;
        track(target, ITERATE_KEY);
        target.forEach((v, k) => {
            callback.call(thisArg, wrap(v), wrap(k), this); //实现深响应
        });
    },

    [Symbol.iterator]: iterationMethod,
    entries: iterationMethod,
    values: valuesIterationMethod,
};

function iterationMethod() {
    const target = this.raw;
    const itr = target[Symbol.iterator]();
    const wrap = val =>
        typeof val === "object" && val !== null ? reactive(val) : val;
    track(target, ITERATE_KEY);
    return {
        next() {
            const { value, done } = itr.next();
            return {
                value: value ? [wrap(value(0)), wrap(value(1))] : value,
                done,
            };
        },
        [Symbol.iterator]() {
            return this;
        },
    };
}

function valuesIterationMethod() {
    const target = this.raw;
    const itr = target.values();
    const wrap = val => (typeof val === "object" ? reactive(val) : val);
    track(target, ITERATE_KEY);

    return {
        next() {
            const { value, done } = itr.next();
            return {
                value: wrap(value);
                done
            }
        },
        [Symbol.iterator]() {
            return this
        }
    }
}

const MAP_KEY_ITERAT_KEY = Stmbol();
function keysIterationMethod() {
    const target = this.raw;
    const itr = target.keys();
    const wrap = (val) => typeof val === "object" ? reactive(val) : val;
    track(target, MAP_KEY_ITERAT_KEY);

    return {
        next() {
            const { value, done } = itr.next();
            return {
                value: wrap(value);
                done
            }
        },
        [Symbol.iterator]() {
            return this
        }
    }
}

function trigger(target, key, type) {
    const depsMap = bucket.get(target);
    if (!depsMap) {
        return;
    }
    const effects = depsMap.get(key);

    const effectsToRun = new Set();
    effects &&
        effects.forEach(effectFn => {
            if (effectFn !== activeEffect) {
                effectsToRun.add(effectFn);
            }
        });

    if (
        type === "ADD" ||
        type === "DELETE" ||
        (type === "SET" &&
            Object.prototype.toString.call(target) === "[object Map]")
    ) {
        const iteraterEffects = depsMap.get(MAP_KEY_ITERAT_KEY);
        iterateEffects &&
            iterateEffects.forEach(effectFn => {
                if (effectFn !== activeEffect) {
                    effectsToRun.add(effectFn);
                }
            });
    }

    effectsToRun.forEach(effectFn => {
        if (effectFn.options.scheduler) {
            effectFn.options.scheduler(effectFn);
        } else {
            effectFn();
        }
    });
}
