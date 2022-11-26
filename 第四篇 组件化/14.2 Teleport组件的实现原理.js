{
    /* <template>
    <Teleport to="body">
        <div class="overlay"></div>
    </Teleport>
</template>

<style scoped>
        .overlay{
            z-index:9999;
        }
</style> */
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
        /*  */
    } else if (typeof type === "object" && type.__isTeleport) {
        type.process(n1, n2, container, anchor, {
            patch,
            patchChildren,
            unmount,
            move(vnode, container, anchor) {
                insert(
                    vnode.component ? vnode.component.subTree.el : vnode.el,
                    container,
                    anchor
                );
            },
        });
        /*  */
    }
}

const Teleport = {
    __isTeleport: true,
    process(n1, n2, container, anchor, internals) {
        const { patch, patchChildren } = internals;
        if (!n1) {
            const target =
                typeof n2.props.to === "string"
                    ? document.querySelector(n2.props.to)
                    : n2.props.to;
            n2.children.forEach(c => patch(null, c, target, anchor));
        } else {
            patchChildren(n1, n2, container);
            if (n2.props.to !== n1.props.to) {
                const newTarget =
                    typeof n2.props.to === "string"
                        ? document.querySelector(n2.props.to)
                        : n2.props.to;
                n2.children.forEach(c => move(c, newTarget));
            }
        }
    },
};
