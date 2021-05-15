figma.showUI(__html__, { width: 200, height: 100 });

figma.ui.onmessage = async (message) => {
  const properties = [];
  const propertyValues = {};

  const selectedIds = figma.currentPage.selection
    .filter((node) => node.type === "GROUP")
    .map((node) => node.id);

  let minX = Number.MAX_VALUE;
  let minY = Number.MAX_VALUE;

  for (const node of figma.currentPage.children.filter(
    (node) => ~selectedIds.indexOf(node.id)
  )) {
    const property = node.name;
    minX = Math.min(node.x, minX);
    minY = Math.min(node.y, minY);
    const values = (node as GroupNode).children;
    properties.push(property);
    propertyValues[property] = values.map((value) => {
      const clone = value.clone();
      clone.setPluginData(
        "rect",
        JSON.stringify({
          x: node.x,
          y: node.y,
          width: node.width,
          height: node.height,
        })
      );
      return clone;
    });
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

  Object.keys(propertyValues).forEach((k) =>
    propertyValues[k].forEach((value) => value.remove())
  );

  figma.viewport.scrollAndZoomIntoView([
    figma.combineAsVariants(components, figma.currentPage),
  ]);

  figma.closePlugin();
};
