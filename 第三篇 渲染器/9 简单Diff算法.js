const oldVNode = {
    type: "div",
    children: [
        { type: "p", children: "1", key: 1 },
        { type: "p", children: "2", key: 2 },
        { type: "p", children: "3", key: 3 },
    ],
};
const newVNode = {
    type: "div",
    children: [
        { type: "p", children: "3", key: 3 },
        { type: "p", children: "1", key: 1 },
        { type: "p", children: "2", key: 2 },
    ],
};

function patchChildren(n1, n2, container) {
    if (typeof n2.children === "string") {
        /*  */
    } else if (Array.isArray(n2.children)) {
        const oldChildren = n1.children;
        const newChildren = n2.children;

        /* const oldLen = oldChildren.length;
        const newLen = newChildren.length;
        const commonLength = Math.min(oldLen, newLen);
        for (let i = 0; i < commonLength; i++) {
            patch(oldChildren[i], newChildren[i], container);
        }
        if (newLen > oldLen) {
            for (let i = commonLength; i < newLen; i++) {
                patch(null, newChildren[i], container);
            }
        } else if (oldLen > newLen) {
            for (let i = commonLength; i < oldLen; i++) {
                unmount(oldChildren[i]);
            }
        } */

        let lastIndex = 0; //寻找过程中的最大索引值
        for (let i = 0; i < newChildren.length; i++) {
            const newVNode = newChildren[i];
            let j = 0;
            let find = false; //是否在旧的一组子节点中找到可复用的节点
            for (j; j < oldChildren.length; j++) {
                const oldVNode = oldChildren[j];
                if (newVNode.key === oldVNode.key) {
                    find = true;
                    patch(oldVNode, newVNode, container);
                    if (j < lastIndex) {
                        //若当前找到的节点在旧children中的索引小于最大索引值，说明该节点对应的真实DOM需移动
                        const prevVNode = newChildren[i - 1];
                        if (prevVNode) {
                            const anchor = prevVNode.el.nextSibling;
                            insert(newVNode.el, container, anchor);
                        }
                    } else {
                        lastIndex = j;
                    }
                    break;
                }
            }
            //运行到这里，说明当前newVNode没有在旧的一组子节点中找到可复用的节点，需要挂载
            if (!find) {
                const prevVNode = newChildren[i - 1];
                let anchor = null;
                if (prevVNode) {
                    anchor = container.firstChild;
                }
                patch(null, newVNode, container, anchor);
            }
        }

        for (let i = 0; i < oldChildren.length; i++) {
            const oldVNode = oldChildren[i];
            const has = newChildren.find(vnode => vnode.key === oldVNode.key);
            if (!has) {
                unmount(oldVNode);
            }
        }
    } else {
        /*  */
    }
}

const renderer = createRenderer({
    /*  */
    insert(el, parent, anchor = null) {
        parent.insertBefore(el, anchor);
    },
    /*  */
});

function patch(n1, n2, container, anchor) {
    /*  */
    if (typeof type === "string") {
        if (!n1) {
            mountElement(n2, container, anchor);
        } else {
            patchElement(n1, n2);
        }
    } else if (type === Text) {
        /*  */
    } else if (type === Fragment) {
        /*  */
    }
}

function mountElement(vnode, container, anchor) {
    /*  */
    insert(el, container, anchor);
}
