var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
figma.showUI(__html__, { width: 200, height: 100 });
figma.ui.onmessage = (message) => __awaiter(this, void 0, void 0, function* () {
    const properties = [];
    const propertyValues = {};
    const selectedIds = figma.currentPage.selection
        .filter((node) => node.type === "GROUP")
        .map((node) => node.id);
    let minX = Number.MAX_VALUE;
    let minY = Number.MAX_VALUE;
    for (const node of figma.currentPage.children.filter((node) => ~selectedIds.indexOf(node.id))) {
        const property = node.name;
        minX = Math.min(node.x, minX);
        minY = Math.min(node.y, minY);
        const values = node.children;
        properties.push(property);
        propertyValues[property] = values.map((value) => {
            const clone = value.clone();
            clone.setPluginData("rect", JSON.stringify({
                x: node.x,
                y: node.y,
                width: node.width,
                height: node.height,
            }));
            return clone;
        });
    }
    function getVariants(i = 0, prev = []) {
        if (i === properties.length) {
            return [prev];
        }
        const property = properties[i];
        return propertyValues[property].flatMap((value) => getVariants(i + 1, [...prev, value]));
    }
    let maxWidth = 0;
    let maxHeight = 0;
    const components = getVariants().map((variant) => {
        const component = figma.createComponent();
        for (const value of variant) {
            const { x, y, width, height } = JSON.parse(value.getPluginData("rect"));
            const clone = value.clone();
            clone.x = x - minX;
            clone.y = y - minY;
            maxWidth = Math.max(clone.x + width, maxWidth);
            maxHeight = Math.max(clone.y + height, maxHeight);
            component.appendChild(clone);
        }
        component.resizeWithoutConstraints(maxWidth, maxHeight);
        component.name = variant.map((value) => value.name).join(" / ");
        component.x = 0;
        component.y = 0;
        return component;
    });
    Object.keys(propertyValues).forEach((k) => propertyValues[k].forEach((value) => value.remove()));
    figma.viewport.scrollAndZoomIntoView([
        figma.combineAsVariants(components, figma.currentPage),
    ]);
    figma.closePlugin();
});
