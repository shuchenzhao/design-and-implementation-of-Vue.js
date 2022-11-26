const obj = { foo: 1 };
const ITERATE_KEY = Symbol();
const proto = { bar: 1 };
const child = reactive(obj);
const parent = reactive(proto);
Object.setPrototypeOf(child, parent);

effect(() => {
    /*  */
});

function createReactive(obj, isShallow = false, isReadonly = false) {
    return new Proxy(obj, {
        //访问属性：obj.foo
        get(target, key, receiver) {
            //代理对象可通过raw属性访问原始数据
            if (key === "raw") {
                return target;
            }
            if (!isReadonly) {
                track(target, key); //建立联系
            }

            const res = Reflect.get(target, key, receiver); //得到原始值结果
            if (isShallow) {
                return res;
            }
            if (typeof res === "object" && res !== null) {
                return isReadonly ? readonly(res) : reactive(res); //调用reactive将结果包装成响应式数据并返回
            }
            return res;
        },

        //判断对象或原型上是否存在给定的key：key in obj
        ownKeys(target) {
            track(target, ITERATE_KEY);
            return Reflect.ownKeys(target);
        },

        //使用for...in循环便利对象:for(const key in obj){}
        set(target, key, newVal, receiver) {
            if (isReadonly) {
                console.log(`属性${key}是只读的`);
                return true;
            }

            const oldVal = target[key];
            const type = Object.prototype.hasOwnProperty.call(target, key)
                ? "SET"
                : "ADD";
            const res = Reflect.set(target, key, newVal, receiver);

            if (target === receiver.raw) {
                if (oldVal !== newVal && !isNaN(oldVal) && isNaN(newVal)) {
                    trigger(target, key, type);
                }
            }

            return res;
        },

        deleteProperty(target, key) {
            if (isReadonly) {
                console.log(`属性${key}是只读的`);
                return true;
            }

            const hasKey = Object.prototype.hasOwnProperty.call(target, key);
            const res = Reflect.deleteProperty(target, key);
            if (res && hadKey) {
                TriggerType(target, key, "DELETE");
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
    const effects = depsMap.get(key);

    const effectsToRun = new Set();
    effects &&
        effects.forEach(effectFn => {
            if (effectFn !== activeEffect) {
                effectsToRun.add(effectFn);
            }
        });

    if (type === "ADD" || type === "DELETE") {
        const iteraterEffects = depsMap.get(ITERATE_KEY);
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

function readonly(obj) {
    return createReactive(obj, false, true);
}

const TriggerType = {
    SET: "SET",
    ADD: "ADD",
};
