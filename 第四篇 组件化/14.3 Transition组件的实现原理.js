const Transition = {
    name: "Transition",
    setup(props, { slots }) {
        return () => {
            const innerVNode = slots.default();

            innerVNode.transition = {
                beforeEnter(el) {
                    el.classList.add("enter-from");
                    el.classList.add("enter-active");
                },
                enter(el) {
                    nextFrame(() => {
                        el.classList.remove("enter-from");
                        el.classList.add("enter-to");
                        el.addEventListener("transitioned", () => {
                            el.classList.remove("enter-to");
                            el.classList.remove("enter-active");
                        });
                    });
                },
                leave(el, performRemove) {
                    el.classList.add("leave-from");
                    el.classList.add("leave-active");
                    document.body.offsetHeight;
                    nextFrame(() => {
                        el.classList.remove("leave-from");
                        el.classList.add("leave-to");
                        el.addEventListener("transitioned", () => {
                            el.classList.remove("leave-to");
                            el.classList.remove("leave-active");
                            performRemove();
                        });
                    });
                },
            };
            return innerVNode;
        };
    },
};

function mountElement(vnode, container, anchor) {
    const el = (vnode.el = createElement(vnode.type));
    if (typeof vnode.children === "string") {
        setElement(el, vnode.children);
    } else if (Array.isArray(vnode.children)) {
        vnode.children.forEach(child => {
            patch(null, child, el);
        });
    }
    if (vnode.props) {
        for (const key in vnode.props) {
            patchProps(el, key, null, vnode.props[key]);
        }
    }
    const needTransition = vnode.transition;
    if (needTransition) {
        vnode.transition.beforeEnter(el);
    }
    insert(el, container, anchor);
    if (needTransition) {
        vnode.transition.enter(el);
    }
}

function unmount(vnode) {
    const needTransition = vnode.transition;
    if (vnode.type === Fragment) {
        vnode.children.forEach(c => unmount(c));
        return;
    } else if (typeof vnode.type === "object") {
        if (vnode.shouldKeepAlive) {
            vnode.keepAliveInstance._deActive(vnode);
        } else {
            unmount(vnode.component.subTree);
        }
        return;
    }
    const parent = vnode.el.parentNode;
    if (parent) {
        const performRemove = () => parent.removeChild(vnode.el);
        if (needTransition) {
            vnode.transition.leave(vnode.el, performRemove);
        } else {
            performRemove();
        }
    }
}
