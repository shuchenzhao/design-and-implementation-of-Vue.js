const cache = new Map();
const KeepAlive = {
    __isKeepAlive: true,
    props: {
        include: RegExp,
        exclude: RegExp,
    },
    setup(props, { slots }) {
        const cache = new Map();
        const instance = currentInstance;
        const { move, createElement } = instance.KeepAliveCtx;

        const storageContainer = createElement("div");

        instance._deActivate = vnode => {
            move(vnode, storageContainer);
        };
        instance._activate = (vnode, container, anchor) => {
            move(vnode, container, anchor);
        };

        return () => {
            let rawVNode = slots.default();
            if (typeof rawVNode.type !== "object") {
                return rawVNode;
            }

            const name = rawVNode.type.name;
            if (
                name &&
                ((props.include && !props.include.test(name)) ||
                    (props.exclude && props.exclude.test(name)))
            ) {
                return rawVNode;
            }

            const cachedVNode = cache.get(rawVNode.type);
            if (cachedVNode) {
                rawVNode.component = cachedVNode.component;
                rawVNode.keptAlive = true;
            } else {
                cache.set(rawVNode.type, rawVNode);
            }

            rawVNode.shouldKeepAlive = true;
            rawVNode.KeepAliveInstance = instance;

            return rawVNode;
        };
    },
};

function unmount(vnode) {
    if (vnode.type === Fragment) {
        vnode.children.forEach(c => unmount(c));
        return;
    } else if (typeof vnode.type === "object") {
        if (vnode.shouldKeepAlive) {
            vnode.keepAliveInstance._deActivate(vnode);
        } else {
            unmount(vnode.component.subTree);
        }
        return;
    }
    const parent = vnode.el.parentNode;
}

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
        if (!n1) {
            if (n2.keptAlive) {
                n2.keepAliveInstance._activate(n2, container, anchor);
            } else {
                mountComponent(n2, container, anchor);
            }
        } else {
            patchComponent(n1, n2, anchor);
        }
    }
}

function mountComponent(vnode, container, anchor) {
    /*  */
    const instance = {
        state,
        props: shallowReactive(props),
        isMounted: false,
        subTree: null,
        slots,
        KeepAliveCtx: null,
    };

    const isKeepAlive = vnode.type.__isKeepAlive;
    if (isKeepAlive) {
        instance.KeepAliveCtx = {
            move(vnode, container, anchor) {
                insert(vnode.component.subTree.el, container, anchor);
            },
            createElement,
        };
    }
    /*  */
}
