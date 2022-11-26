//同步渲染App组件到页面
import App from "App.vue";
createApp(App).mount("#app");
//异步渲染
const loader = () => import("App.vue"); //import()返回一个Promise实例
loader().then(App => {
    createApp(App).mount("#app");
});

{
    /* <template>
    <AsyncComp/>
<template>
<script>
export default {
    components:{
        AsyncComp:defineAsyncComponent(()=>import("CompA"));
    }
}
</script> */
}

//defineAsyncComponent定义一个异步组件，它接收一个异步组件加载器作为参数
function defineAsyncComponent(options) {
    //options可以是配置项，也可以是加载器
    if (typeof options === "function") {
        //如果是加载器，则将其格式化为配置项
        options = {
            loader: options,
        };
    }
    const { loader } = options;

    let InnerComp = null; //存储异步加载的组件

    let retries = 0;
    function load() {
        return loader().catch(err => {
            if (options.onError) {
                return new Promise((resolve, reject) => {
                    const retry = () => {
                        resolve(load());
                        retries++;
                    };
                    const fail = () => reject(err);
                    options.onError(retry, fail, retries);
                });
            } else {
                throw error;
            }
        });
    }

    return {
        name: "AsyncComponentWrapper",
        setup() {
            const loaded = ref(false);
            const errer = shallowRef(null);
            const loading = ref(false);

            let loadingTimer = null;
            if (options.delay) {
                loadingTimer = setTimeout(() => {
                    loading.value = true;
                }, options.delay);
            } else {
                loading.value = true;
            }

            load()
                .then(c => {
                    (InnerComp = c), (loaded.value = true);
                })
                .catch(err => {
                    error.value = err;
                })
                .finally(() => {
                    loading.value = false;
                    clearTimeout(loadingtimer);
                });

            loader()
                .then(c => {
                    InnerComp = c;
                    loaded.value = true;
                })
                .catch(err => (err.value = err))
                .finally(() => {
                    loading.value = false;
                    clearTimeout(loadingTimer);
                });

            let timer = null;
            if (options.timeout) {
                timer = setTimeout(() => {
                    const err = new Error(
                        `Async component timed out after ${options.timeout}ms.`
                    );
                    error.value = err;
                }, options.timeout);
            }
            onMounted(() => {
                clearTimeout(timer);
            });
            const placeholder = { type: Text, children: "" };

            return () => {
                if (loaded.value) {
                    return { type: InnerComp };
                } else if (error.value && options.errorComponent) {
                    return {
                        type: options.errorComponent,
                        props: { error: error.value },
                    };
                } else if (loading.value && options.loadingComponent) {
                    return { type: options.loadingComponent };
                }
                return placeholder;
            };
        },
    };
}

const AsyncComp = defineAsyncComponent({
    loader: () => import("ComA.vue"),
    timeout: 2000,
    errorComponent: MyErrorComp,
});

//延迟与loading组件 用户接口
defineAsyncComponent({
    loader: () =>
        new Promise(r => {
            /*  */
        }),
    delay: 200,
    loadingComponent: {
        setup() {
            return () => {
                return { type: "h2", children: "Loading..." };
            };
        },
    },
});

function unmount(vnode) {
    if (vnode.type === Fragment) {
        vnode.children.forEach(c => unmount(c));
        return;
    } else if (typeof vnode.type === "object") {
        unmount(vnode.component.subTree);
        return;
    }
    const parent = vnode.el.parentNode;
    if (parent) {
        parent.removeChild(vnode.el);
    }
}

//函数式组件 用户接口
function MyFuncComp(props) {
    return { type: "h1", children: props.title };
}
MyFuncComp.props = {
    title: String,
};

function patch(n1, n2, container, anchor) {
    if (n1 && n1.type !== n2.type) {
        unmount(n1);
        n1 = null;
    }

    const { type } = n2;

    if (typeof type === "string") {
        /*  */
    } else if (type === Text) {
        /*  */
    } else if (type === Fragment) {
        /*  */
    } else if (typeof type === "object" || typeof type === "function") {
        //有状态组件、函数式组件
        if (!n1) {
            mountComponent(n2, container, anchor);
        } else {
            patchComponent(n1, n2, anchor);
        }
    }
}

function mountComponent(vnode, container, anchor) {
    const isFunctional = typeof vnode.type === "function";

    let componentOptions = vnode.type;
    if (isFunctional) {
        componentOptions = {
            render: vnode.type,
            props: vnode.type.props,
        };
    }
    /*  */
}
