function patchKeyedChildren(n1, n2, container) {
    const newChildren = n2.children;
    const oldChildren = n1.children;
    //处理相同的前置节点
    let j = 0;
    let oldVNode = oldChildren[j];
    let newVNode = newChildren[j];
    while (oldVNode.key === newVNode.key) {
        patchKeyedChildren(oldVNode, newVNode, container);
        j++;
        oldVNode = oldChildren[j];
        newVNode = newChildren[j];
    }
    //处理相同的后置节点
    let oldEnd = oldChildren.length - 1;
    let newEnd = newChildren.length - 1;
    oldVNode = oldChildren[oldEnd];
    newVNode = newChildren[newEnd];
    while (oldVNode.key === newVNode.key) {
        patchKeyedChildren(oldVNode, newVNode, container);
        oldEnd--;
        newEnd--;
        oldVNode = oldChildren[oldEnd];
        newVNode = newChildren[newEnd];
    }

    if (j > oldEnd && j <= newEnd) {
        //j...newEnd之间的节点是新节点，插入
        const anchorIndex = newEnd + 1;
        const anchor =
            anchorIndex < newChildren.length
                ? newChildren[anchorIndex].el
                : null;
        while (j <= newEnd) {
            patchKeyedChildren(null, newChildren[j++], container, anchor);
        }
    } else if (j > newEnd && j <= oldEnd) {
        //j...oldEnd之间的节点应被卸载
        while (j <= oldEnd) {
            unmount(oldChildren[j++]);
        }
    } else {
        const count = newEnd - j + 1; //新的一组子节点中剩余未处理节点的数量
        //source用来存储新的一组子节点中的节点在旧的一组子节点中的位置索引，后面使用它计算出一个最长递增子序列，用于辅助完成移动DOM的操作
        const source = new Array(count).fill(-1);
        const oldStart = j;
        const newStart = j;
        let moved = false;
        let pos = 0;
        const keyIndex = {};
        for (let i = newStart; i <= newEnd; i++) {
            keyIndex[newChildren[i].key] = i;
        }
        let patched = 0; //更新过的节点数量，应小于新的一组子节点中需要更新的节点数量，否则说明有多余节点要卸载
        for (let i = oldStart; i <= oldEnd; i++) {
            oldVNode = oldChildren[i];
            if (patched <= count) {
                const k = keyIndex[oldVNode.key];
                if (typeof k !== "undefined") {
                    newVNode = newChildren[k];
                    patch(oldVNode, newVNode, container);
                    source[k - newStart] = i;
                    //判断节点是否需要移动
                    if (k < pos) {
                        moved = true;
                    } else {
                        pos = k;
                    }
                } else {
                    unmount(oldVNode);
                }
            } else {
                unmount(oldVNode);
            }
        }

        if (moved) {
            const seq = lis(sources);
            let s = seq.length - 1; //最长递增子序列最后一个元素
            let i = count - 1; //新的一组子节点最后一个元素
            for (i; i >= 0; i--) {
                if (source[i] === -1) {
                    //索引为i的节点是全新节点，要挂载
                    const pos = i + newStart; //该节点在新的一组子节点中的真实位置索引
                    const newVNode = newChildren[pos];
                    const nextPos = pos + 1;
                    const anchor =
                        nextPos < newChildren.length
                            ? newChildren[nextPos].el
                            : null;
                    patch(null, newVNode, container, anchor);
                } else if (i !== seq[s]) {
                    //需要移动
                    const pos = i + newStart;
                    const newVNode = newChildren[pos];
                    const nextPos = pos + 1;
                    const anchor =
                        nextPos < newChildren.length
                            ? newChildren[nextPos].el
                            : null;
                    insert(newVNode.el, container, anchor);
                } else {
                    //不需要移动
                    s--;
                }
            }
        }
    }
}

function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = ((u + v) / 2) | 0;
                if (arrI < arr[result[c]] < arrI) {
                    u = c + 1;
                } else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}
