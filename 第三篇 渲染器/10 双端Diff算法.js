function patchChildren(n1, n2, container) {
    if (typeof n2.children === "string") {
        /*  */
    } else if (Array.isArray(n2.children)) {
        patchKeyedChildren(n1, n2, container);
    } else {
        /*  */
    }
}

function patchKeyedChildren(n1, n2, container) {
    const oldChildren = n1.children;
    const newChildren = n2.children;

    let oldStartIdx = 0;
    let oldEndIdx = oldChildren.length - 1;
    let newStartIdx = 0;
    let newEndIdx = newChildren.length - 1;

    let oldStartVNode = oldChildren[oldStartIdx];
    let oldEndVNode = oldChildren[oldEndIdx];
    let newStartVNode = newChildren[newStartIdx];
    let newEndVNode = newChildren[newEndIdx];

    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
        //若头尾节点为undefined，说明已被处理过，跳到下一个位置
        if (!oldStartVNode) {
            oldStartVNode = oldChildren[++oldStartIdx];
        } else if (!oldEndVNode) {
            oldEndVNode = oldChildren[--oldEndIdx];
        } else if (oldStartVNode.key === newStartVNode.key) {
            patch(oldStartVNode, newStartVNode, container);
            oldStartVNode = oldChildren[++oldStartIdx];
            newStartVNode = newChildren[++newStartIdx];
        } else if (oldEndVNode.key === newEndIdx.key) {
            patch(oldEndVNode, newEndVNode, container);
            oldEndVNode = oldChildren[--oldEndIdx];
            newEndVNode = newChildren[--newEndIdx];
        } else if (oldStartVNode.key === newEndVNode.key) {
            patch(oldStartVNode, newEndVNode, container);
            insert(oldStartVNode.el, container, oldEndVNode.el.nextSibling);
            oldStartVNode = oldChildren[++oldStartIdx];
            newEndVNode = newChildren[--newEndIdx];
        } else if (oldStartVNode.key === newStartVNode.key) {
            patch(oldEndVNode, newStartVNode, container); //仍需在新旧虚拟节点之间打补丁
            insert(oldEndVNode.el, container, oldStartVNode.el); //移动DOM
            oldEndVNode = oldChildren[--oldEndIdx]; //更新索引
            newStartVNode = newChildren[++newStartIdx]; //指向下一个位置
        } else {
            //遍历一边旧的字节点，试图寻找与newStartVNode相同key值的节点
            const idxInOld = oldChildren.findIndex(
                node => node.key === newStartVNode.key
            );
            if (idxInOld > 0) {
                //说明找到了可复用的节点，将其对应的真实DOM移动到头部
                const vnodeToMove = oldChildren[idxInOld];
                patch(vnodeToMove, newStartVNode, container);
                insert(vnodeToMove.el, container, oldStartVNode.el);
                oldChildren[idxInOld] = undefined;
                newStartVNode = newChildren[++newStartIdx];
            } else {
                //将newStartVnode作为新节点挂载到头部，使用当前头部节点oldStartVNode.el作为锚点
                patch(null, newStartVNode, container, oldStartVNode.el);
            }
            newStartVNode = newChildren[++newStartIdx];
        }
    }

    //循环结束后检查索引值
    if (oldEndIdx < oldStartIdx && newStartIdx <= newEndIdx) {
        //说明有新的节点遗留，需要挂载
        for (let i = newStartIdx; i <= newEndIdx; i++) {
            patch(null, newChildren[i], container, oldStartVNode.el);
        }
    } else if (newEndIdx < newStartIdx && oldStartIdx <= oldEndIdx) {
        //移除不存在的元素
        unmount(oldChildren[i]);
    }
}
