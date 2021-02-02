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
function rasterize(node, scale) {
    return __awaiter(this, void 0, void 0, function* () {
        const { width, height } = node;
        const frame = figma.createFrame();
        frame.name = node.name;
        frame.resizeWithoutConstraints(width, height);
        frame.x = 0;
        frame.y = 0;
        const data = yield node.exportAsync({
            format: "PNG",
            constraint: { type: "SCALE", value: scale },
        });
        const image = figma.createImage(data);
        const paint = {
            type: "IMAGE",
            scaleMode: "FIT",
            imageHash: image.hash,
        };
        frame.fills = [paint];
        return frame;
    });
}
figma.ui.onmessage = (message) => __awaiter(this, void 0, void 0, function* () {
    const scale = parseFloat(message.scale);
    const properties = [];
    const propertyValues = {};
    const selectedIds = figma.currentPage.selection
        .filter((node) => node.type === "GROUP")
        .map((node) => node.id);
    for (const node of figma.currentPage.children.filter((node) => ~selectedIds.indexOf(node.id))) {
        const property = node.name;
        const values = node.children;
        properties.push(property);
        propertyValues[property] = yield Promise.all(values.map((value) => rasterize(value, scale)));
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
        let { width, height } = variant[0];
        width *= scale;
        height *= scale;
        component.resizeWithoutConstraints(width, height);
        for (const value of variant) {
            const clone = value.clone();
            component.appendChild(clone);
        }
        component.name = variant.map((value) => value.name).join(" / ");
        component.x = 0;
        component.y = 0;
        return component;
    });
    figma.viewport.scrollAndZoomIntoView([
        figma.combineAsVariants(components, figma.currentPage),
    ]);
    figma.closePlugin();
});
