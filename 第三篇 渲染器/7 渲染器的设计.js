function renderer(domString, container) {
    container.innerHTML = domString;
}

function createRenderer(options) {
    const { createElement, insert, setElementText } = options;

    function render(vnode, container) {
        if (vnode) {
            //新vnode存在，将其与旧的vnode一起传给patch函数，进行打补丁
            patch(container._vnode, vnode, container);
        } else {
            //旧vnode存在，且新vnode不存在，说明是unmount卸载操作，将container内DOM清空即可
            if (container._vnode) {
                container.innerHTML = "";
            }
        }
        container._vnode = vnode;
    }

    function patch(n1, n2, container) {
        if (!n1) {
            mountElement(n2, container); //挂载
        } else {
            //打补丁
        }
    }

    function mountElement(vnode, container) {
        const el = createElement(vnode.type);
        if (typeof vnode.children === "string") {
            setElementText(el, vnode.children);
        }
        insert(el, container);
    }

    function hydrate(vnode, container) {}
    return {
        render,
        hydrate,
    };
}

const renderer = createRenderer({
    createElement(tag) {
        return document.createElement(tag);
    },
    setElementText(el, text) {
        el.textContent = text;
    },
    insert(el, parent, anchor = null) {
        parent.insertBefore(el, anchor);
    },
});
renderer.render(oldVNode, document.querySelector("#app"));
renderer.render(newVNode, document.querySelector("#app"));
renderer.render(null, document.querySelector("#app"));

const vnode = {
    type: "h1",
    children: "hello",
};
