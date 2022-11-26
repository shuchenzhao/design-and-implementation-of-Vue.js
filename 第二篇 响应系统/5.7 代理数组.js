const arrayInstrumentations = {};
["includes", "indexOf", "lastIndexOf"].forEach(method => {
    const originMethod = Array.prototype[method];
    arrayInstrumentations[method] = function (...args) {
        //this是代理对象，先在代理对象中查找，将结果存储搭到res中
        let res = originMethod.apply(this, args);
        if (res === false) {
            //没找到，通过this.raw拿到原始数组，再去其中查找并更新res值
            res = originMethod.apply(this.raw, args);
        }
        return res;
    };
});

let shouldTrack = true;
["push", "pop", "shift", "unshift", "splice"].forEach(method => {
    const originMethod = Array.prototype[method];
    arrayInstrumentations[method] = function (...args) {
        shouldTrack = false;
        let res = originMethod.apply(this, args);
        shouldTrack = true;
        return res;
    };
});

function track(target, key) {
    if (!activeEffect || !shouldTrack) {
        return;
    }
    /*  */
}

function createReactive(obj, isShallow = false, isReadonly = false) {
    return new Proxy(obj, {
        set(target, key, newVal, receiver) {
            if (isReadonly) {
                console.warn(`属性${key}是只读的`);
                return true;
            }

            const oldVal = target[key];
            //若数组被设置的索引值大于数组长度，length值会被更新
            const type = Array.isArray(target)
                ? Number(key) < target.length
                    ? "SET"
                    : "ADD"
                : Object.prototype.hasOwnProperty.call(target, key)
                ? "SET"
                : "ADD";

            const res = Reflect.set(target, key, newVal, receiver);
            if (target === receiver.raw) {
                if (
                    oldval !== newVal &&
                    (oldVal === oldVal || newVal === newVal)
                ) {
                    trigger(target, key, type, newVal);
                }
            }
            return res;
        },

        ownKeys(target) {
            track(target, Array.isArray(target) ? "length" : ITERATE_KEY);
            return Reflect.ownKeys(target);
        },

        get(target, key, receiver) {
            if (key === "raw") {
                return target;
            }

            if (
                Array.isArray(target) &&
                arrayInstrumentations.hasOwnProperty(key)
            ) {
                return Reflect.get(arrayInstrumentations, key, receiver);
            }

            if (!isReadonly && typeof key !== "symbol") {
                track(target, key);
            }

            const res = Reflect.get(target, key, receiver);
            if (isShallow) {
                return res;
            }
            if (typeof res === "object" && res !== null) {
                return isReadonly ? readonly(res) : reactive(res);
            }
            return res;
        },
    });
}

function trigger(target, key, type) {
    const depsMap = bucket.get(target);
    if (!depsMap) {
        return;
    }
    /* ... */

    if (type === "ADD" || Array.isArray(target)) {
        const lengthEffects = depsMap.get("length");
        lengthEffects &&
            lengthEffects.forEach(effectFn => {
                if (effectFn !== activeEffect) {
                    effectsToRun.add(effectFn);
                }
            });
    }

    if (Array.isArray(target) && key === "length") {
        //当修改length属性值时，只有索引值>=新length属性值的元素才触发响应
        depsMap.forEach((effects, key) => {
            if (key >= newVal) {
                effects.forEach(effectFn => {
                    if (effectFn !== activeEffect) {
                        effectsToRun.add(effectFn);
                    }
                });
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

const reactiveMap = new Map();
function reactive(obj) {
    //优先通过原始对象obj寻找之前创建的代理对象，若找到则直接返回已有的代理对象
    const existionProxy = reactiveMap.get(obj);
    if (existionProxy) {
        return existionProxy;
    }
    const proxy = createReactive(obj);
    reactiveMap.set(obj, proxy); //避免重复创建
}
