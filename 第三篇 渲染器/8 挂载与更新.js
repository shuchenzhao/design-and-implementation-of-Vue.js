const renderer = createRenderer({
    createElement(tag) {
        return document.createElement(tag);
    },
    setElementText(el, text) {
        el.textCOntent = text;
    },
    insert(el, parent, anchor = null) {
        parent.insertBefore(el, anchor);
    },
    createText(text) {
        return document.createTextNode(text);
    },
    setText(el, text) {
        el.nodeValue = text;
    },
    //将属性设置相关操作封装到patchProps中，并作为渲染器选项传递
    patchProps(el, key, prevValue, nextValue) {
        if (/^on/.test(key)) {
            const invokers = el._vei || (el._vei = {}); //获取为该元素伪造的事件处理函数，vei=vue event invoker
            let invoker = invokers[key];
            const name = key.slice(2).toLowerCase();
            if (nextValue) {
                //若没有invoker，则将一个伪造的invoker缓存到el._vei中
                if (!invoker) {
                    //将事件处理函数缓存到ei._vei[key]下，避免覆盖
                    invoker = el._vei[key] = e => {
                        //如果事件发生的时间早于事件处理函数绑定的时间，则不执行事件处理函数
                        if (e.timeStamp < invoker.attached) {
                            return;
                        }
                        if (Array.isArray(invoker.value)) {
                            invoker.value.forEach(fn => fn(e));
                        } else {
                            invoker.value(e);
                        }
                    };
                    invoker.value = nextValue;
                    invoker.attached = performance.now();
                    el.addEventListener(name, invoker);
                } else {
                    //invoker存在，只需更新
                    invoker.value = nextValue;
                }
            } else if (invoker) {
                //新的绑定函数不存在，且之前绑定的invoker存在，则移除绑定
                el.removeEventListener(name, invoker);
            }
        } else if (key === "class") {
            el.className = nextValue || "";
        } else if (shouldSetAsProps(el, key, nextValue)) {
            const type = typeof el[key];
            if (type === "boolean" && nextValue === "") {
                el[key] = true;
            } else {
                el[key] = nextValue;
            }
        } else {
            el.setAttribute(key, vnode.props[key]);
        }
    },
});

function mountElement(vnode, container) {
    const el = (vnode.el = createElement(vnode.type));

    if (typeof vnode.children === "string") {
        setElementText(el, vnode.children);
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

    insert(el, container);
}

function shouldSetAsProps(el, key, value) {
    if (key === "form" && el.tagName === "INPUT") {
        return false;
    }
    return key in el;
}

function render(vnode, container) {
    if (vnode) {
        patch(container._vnode, vnode, container);
    } else {
        if (container._vnode) {
            unmount(container._vnode);
        }
    }
    container._vnode = vnode;
}

function unmount(vnode) {
    if (vnode.type === Fragment) {
        vnode.children.forEach(c => unmount(c));
        return;
    }
    const parent = vnode.el.parentNode;
    if (parent) {
        parent.removeChild(vnode.el);
    }
}

function patch(n1, n2, container) {
    //若新旧vnode类型不同，直接将旧的卸载
    if (n1 && n1.type !== n2.type) {
        unmount(n1);
        n1 = null;
    }
    //运行至此说明n1和n2描述内容相同
    const { type } = n2;
    if (typeof type === "string") {
        //说明n2描述的是普通标签元素
        if (!n1) {
            mountElement(n2, container);
        } else {
            patchElement(n1, n2);
        }
    } else if (typeof type === "object") {
        //说明n2描述的是组件
    } else if (type === "Text") {
        if (!n1) {
            const el = (n2.el = createText(n2.children));
            insert(el, container);
        } else {
            const el = (n2.el = n1.el);
            if (n2.children !== n1.children) {
                setText(el, n2.children);
            }
        }
    } else if (type === "Fragment") {
        if (!n1) {
            n2.children.forEach(c => patch(null, c, container));
        } else {
            patchChildren(n1, n2, container);
        }
    }
}

function patchElement(n1, n2) {
    const el = (n2.el = n1.el);
    const oldProps = n1.props;
    const newProps = n2.props;
    //第一步：更新props
    for (const key in newProps) {
        if (newProps[key] !== oldProps[key]) {
            patchProps(el, key, oldProps[key], newProps[key]);
        }
    }
    for (const key in oldProps) {
        if (!(key in newProps)) {
            patchProps(el, key, oldProps[key], null);
        }
    }
    //第二步：更新children
    patchChildren(n1, n2, el);
}

function patchChildren(n1, n2, container) {
    if (typeof n2.children === "string") {
        //旧子节点的类型有三种可能：没有子节点、文本子节点、一组子节点，只有一组子节点时需要逐个卸载，其他什么都不用做
        if (Array.isArray(n1.children)) {
            n1.children.forEach(c => unmount(c));
        }
        setElementText(container, n2.children);
    } else if (Array.isArray(n2.children)) {
        //新节点是一组子节点
        if (Array.isArray(n1.children)) {
            //运行到这里，说明新旧子节点都是一组子节点，需要核心的Diff算法，这里先傻瓜式书写
            n1.children.forEach(c => unmount(c));
            n2.children.forEach(c => patch(null, c, container));
        } else {
            setElementText(container, "");
            n2.children.forEach(c => patch(null, c, container));
        }
    } else {
        //运行到这里，说明新子节点不存在
        if (Array.isArray(n1.children)) {
            n1.children.forEach(c => unmount(c));
        } else if (typeof n1.children === "string") {
            setElementText(container, "");
        }
    }
}
