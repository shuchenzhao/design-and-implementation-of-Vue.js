function patch(n1, n2, container, anchor) {
    if (n1 && n1.type !== n2.type) {
        unmount(n1);
        n1 = null;
    }
    const { type } = n2;
    if (typeof type === "string") {
        //作为普通元素处理
    } else if (type === Text) {
        //作为文本节点处理
    } else if (type === Fragment) {
        //作为片段处理
    } else if (typeof type === "object") {
        if (!n1) {
            mountComponent(n2, container, anchor);
        } else {
            patchComponent(n1, n2, anchor);
        }
    }
}

function mountComponent(vnode, container, anchor) {
    const componentOptions = vnode.type;
    const {
        render,
        data,
        setup,
        props: propsOption,
        beforeCreate,
        created,
        beforeMount,
        mounted,
        beforeUpdate,
        updated,
    } = componentOptions;

    beforeCreate && beforeCreate();

    const state = reactive(data());
    const [props, attrs] = resolveProps(propsOption, vnode.props);
    const slots = vnode.children || {};

    //定义组件实例，一个组件本质上是一个对象，包含与组件有关的状态信息
    const instance = {
        state,
        props: shallowReactive(props),
        isMounted: false,
        subTree: null, //组件所渲染内容
        slots,
        mounted: [],
    };

    const setupContext = { attrs, emit, slots };
    setCurrentInstance(instance);
    const setupResult = setup(shallowReadonly(instance.props), setupContext);
    setCurrentInstance(null);
    let setupState = null;
    if (typeof setupResult === "function") {
        if (render) {
            console.error("setup函数返回渲染函数，render选项将被忽略");
            render = setupResult;
        }
    }

    vnode.component = instance;

    //创建渲染上下文对象，本质上是组件实例的代理
    //每当在渲染函数或生命周期钩子中通过this来读取数据时，都优先从组件的自身状态中读取，如果组件本身没有对应数据，则再从props数据中读取
    const renderContext = new Proxy(instance, {
        get(t, k, r) {
            const { state, props, slots } = t;
            if (k === "$slots") {
                return slots;
            }
            if (state && k in state) {
                return state[k];
            } else if (k in props) {
                return props[k];
            } else if (setupState && k in setupState) {
                return setupState[k];
            } else {
                console.error("doesn't exist");
            }
        },
        set(t, k, v, r) {
            const { state, props } = t;
            if (state && k in state) {
                state[k] = v;
            } else if (k in props) {
                props[k] = v;
            } else if (setupState && k in setupState) {
                setupState[k] = v;
            } else {
                console.error("doesn't exist");
            }
        },
    });

    created && created.call(state);

    effect(
        () => {
            const subTree = render().call(state, state);
            if (!instance.isMounted) {
                beforeMount && beforeMount.call(state);
                patch(null, subTree, container, anchor);
                instance.isMounted = true;
                mounted && mounted.call(state);
                instance.mounted &&
                    instance.mounted.forEach(hook => hook.call(renderContext));
            } else {
                beforeUpdate && beforeUpdate.call(state);
                patch(instance.subTree, subTree, container, anchor);
                updated && updated.call(state);
            }
            instance.subTree = subTree;
        },
        {
            scheduler: queueJob,
        }
    );
}

const MyComponent = {
    name: "MyComponent",
    props: {
        title: String,
    },
    data() {
        return {
            foo: "hello world",
        };
    },
    render() {
        //组件的渲染函数，必须返回虚拟DOM
        return {
            type: "div",
            children: `foo:${this.foo}`,
        };
    },
};
const CompVNode = {
    type: MyComponent,
};
renderer.render(CompVNode, document.querySelector("#app"));

const queue = new Set();
let isFlushing = false;
const p = Promise.resolve();
function queueJob(job) {
    queue.add(job);
    if (!isFlushing) {
        isFlushing = true;
        p.then(() => {
            try {
                queue.forEach(job => job());
            } finally {
                isFlushing = false;
                queue.clear = 0;
            }
        });
    }
}

function resolveProps(options, propsData) {
    const props = {};
    const attrs = {}; //任何没有显式声明为props的属性都会存储到attrs中
    for (const key in propsData) {
        if (key in options || key.startsWith("on")) {
            props[key] = propsData[key];
        } else {
            attrs[key] = propsData[key];
        }
    }
    return [props, attrs];
}

function patchComponent(n1, n2, anchor) {
    const instance = (n2.component = n1.component);
    const { props } = instance;
    if (hasPropsChanged(n1.props, n2.props)) {
        const [nextProps] = resolveProps(n2.type.props, n2.props);
        for (const k in nextProps) {
            props[k] = nextProps[k];
        }
        for (const k in nextProps) {
            if (!(k in nextProps)) {
                delete props[k];
            }
        }
    }
}

function hasPropsChanged(prevProps, nextProps) {
    const nextKeys = Object.keys(nextProps);
    if (nextKeys.length !== Object.keys(prevProps).length) {
        return true;
    }
    for (let i = 0; i < nextKeys.length; i++) {
        const key = nextKeys[i];
        if (nextProps[key] !== prevProps[key]) {
            return true;
        }
    }
    return false;
}

function emit(event, ...payload) {
    const eventName = `on${event[0].toUpperCase() + event.slice(1)}`;
    const handler = instance.props[eventName];
    if (handler) {
        handler(...payload);
    } else {
        console.error("the event doesn't exist");
    }
}

let currentInstance = null; //当前正在被初始化的组件实例
function setCurrentInstance(instance) {
    currentInstance = instance;
}

function onMounted(fn) {
    if (currentInstance) {
        currentInstance.mounted.push(fn);
    } else {
        console.error("onMounted函数只能在setup中调用");
    }
}
