figma.showUI(__html__, { width: 200, height: 100 });

async function rasterize(node, scale) {
  let { width, height } = node;
  width *= scale;
  height *= scale;
  const frame = figma.createFrame();
  frame.name = node.name;
  frame.resizeWithoutConstraints(width, height);
  frame.x = 0;
  frame.y = 0;
  const data = await node.exportAsync({
    format: "PNG",
    constraint: { type: "SCALE", value: scale },
  });
  const image = figma.createImage(data);
  const paint: ImagePaint = {
    type: "IMAGE",
    scaleMode: "FIT",
    imageHash: image.hash,
  };
  frame.fills = [paint];
  return frame;
}

figma.ui.onmessage = async (message) => {
  const scale = parseFloat(message.scale);
  const properties = [];
  const propertyValues = {};

  const selectedIds = figma.currentPage.selection
    .filter((node) => node.type === "GROUP")
    .map((node) => node.id);

  for (const node of figma.currentPage.children.filter(
    (node) => ~selectedIds.indexOf(node.id)
  )) {
    const property = node.name;
    const values = (node as GroupNode).children;
    properties.push(property);
    propertyValues[property] = await Promise.all(
      values.map((value) => rasterize(value, scale))
    );
  }

  function getVariants(i = 0, prev = []) {
    if (i === properties.length) {
      return [prev];
    }
    const property = properties[i];
    return propertyValues[property].flatMap((value) =>
      getVariants(i + 1, [...prev, value])
    );
  }

  const components = getVariants().map((variant) => {
    const component = figma.createComponent();
    const { width, height } = variant[0];
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

  Object.keys(propertyValues).forEach((k) =>
    propertyValues[k].forEach((value) => value.remove())
  );

  figma.viewport.scrollAndZoomIntoView([
    figma.combineAsVariants(components, figma.currentPage),
  ]);

  figma.closePlugin();
};
