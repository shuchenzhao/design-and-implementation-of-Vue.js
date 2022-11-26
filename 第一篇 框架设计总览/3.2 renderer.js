//假设有如下虚拟DOM：
const myComponent = function () {
    return {
        tag: "div",
        props: {
            onClick: () => alert("hello"),
        },
        children: "click me",
    };
};

const vnode = {
    tag: myComponent;
}

//渲染器
function renderer(vnode, container) {
    if (typeof vnode.tag === "string") {
        mountElement(vnode, container);
    } else if (typeof vnode.tag === "function") {
        mountComponent(vnode, container);
    }
}

function mountElement(vnode, container) {
    const el = document.createElement(vnode.tag);
    for (const key in vnode.props) {
        if (/^on/.test(key)) {
            el.addEventListener(key.substr(2).toLowerCase(), vnode.props[key]);
        }
    }

    if (typeof vnode.children === "string") {
        el.appendChild(document.createTextNode(vnode.children));
    } else if (Array.isArray(vnode.children)) {
        vnode.children.forEach(child => renderer(child, el));
    }

    container.appendChild(el);
}

function mountComponent(vnode, container) {
    const subtree = vnode.tag;
    renderer(subtree, container);
}
