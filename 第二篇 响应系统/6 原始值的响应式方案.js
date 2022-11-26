function ref(val) {
    const wrapper = {
        value: val,
    };
    Object.defineProperty(wrapper, "__v_isRef", {
        value: true,
    }); //区分一个数据是否是ref
    return reactive(wrapper);
}

const obj = reactive({ foo: 1, bar: 2 }); //obj是响应式数据
//newObj对象下具有与obj对象同名的属性，并且每个属性值都是一个对象，该对象具有一个访问器属性value，当读取value的值时，其实读取的是obj对象下相应的属性值
const newObj = proxyRefs({ ...toRefs(obj) });

function toRef(obj, key) {
    const wrapper = {
        get value() {
            return obj[key];
        },
        set value(val) {
            obj[key] = val;
        },
    };
    Object.defineProperty(wrapper, "__v_isRef", {
        value: true,
    });
    return wrapper;
}

function toRefs(obj) {
    const ret = {};
    for (const key in obj) {
        ret[key] = toRef(obj, key);
    }
}

function proxyRefs(target) {
    return new Proxy(target, {
        get(target, key, receiver) {
            const value = Reflect.get(target, key, reveiver);
            //自动脱ref，若读取的属性是一个ref，则返回它的value
            return value.__v_isRef ? value.value : value;
        },
        set(target, key, newValue, oldValue) {
            const value = target[key];
            if (value.__v_isRef) {
                value.value = newValue;
                return value;
            }
            return Reflect.set(target, key, newValue, receiver);
        },
    });
}
