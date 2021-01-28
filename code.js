const properties = [];
const propertyValues = {};
const selectedIds = figma.currentPage.selection
    .filter((node) => node.type === "GROUP")
    .map((node) => node.id);
for (const node of figma.currentPage.children.filter((node) => ~selectedIds.indexOf(node.id))) {
    const property = node.name;
    const values = node.children;
    properties.push(property);
    propertyValues[property] = values;
    console;
}
function getVariants(i = 0, prev = []) {
    if (i === properties.length) {
        return [prev];
    }
    const property = properties[i];
    return propertyValues[property].flatMap((value) => getVariants(i + 1, [...prev, value]));
}
const components = getVariants().map((variant) => {
    const component = figma.createComponent();
    const { width, height } = variant[0];
    component.resizeWithoutConstraints(width, height);
    for (const value of variant) {
        component.appendChild(value.clone());
    }
    component.name = variant.map((value) => value.name).join(" / ");
    return component;
});
figma.viewport.scrollAndZoomIntoView([
    figma.combineAsVariants(components, figma.currentPage),
]);
figma.closePlugin();
