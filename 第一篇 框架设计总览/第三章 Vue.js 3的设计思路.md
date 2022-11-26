虚拟DOM：使用JS对象来描述UI

渲染器把虚拟DOM对象渲染成真实DOM元素，精髓在更新时的Diff算法

组件本质：就是一组虚拟DOM元素的封装，它可以是一个返回虚拟DOM的函数，也可以是一个对象，但这个对象必须有一个函数来产出组件要渲染的虚拟DOM。渲染器在渲染组件时，会先获取组件要渲染的内容，即执行组件的渲染函数并得到其返回值，称之为subtree，最后再递归地调用渲染器将subtree渲染出即可。

编译器：把模板编译为渲染函数

```javascript
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
    tag: myComponent
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

```

