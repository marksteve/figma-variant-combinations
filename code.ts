figma.showUI(__html__, { width: 200, height: 100 });

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
    propertyValues[property] = values;
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

  const components = await Promise.all<ComponentNode>(
    getVariants().map(async (variant) => {
      const component = figma.createComponent();
      let { width, height } = variant[0];
      width *= scale;
      height *= scale;
      component.resizeWithoutConstraints(width, height);
      for (const value of variant) {
        const node = figma.createFrame();
        node.resizeWithoutConstraints(width, height);
        node.x = 0;
        node.y = 0;
        const data = await value.exportAsync({
          format: "PNG",
          constraint: { type: "SCALE", value: scale },
        });
        const image = figma.createImage(data);
        const paint: ImagePaint = {
          type: "IMAGE",
          scaleMode: "FIT",
          imageHash: image.hash,
        };
        node.fills = [paint];
        component.appendChild(node);
      }
      component.name = variant.map((value) => value.name).join(" / ");
      component.x = 0;
      component.y = 0;
      return component;
    })
  );

  figma.viewport.scrollAndZoomIntoView([
    figma.combineAsVariants(components, figma.currentPage),
  ]);

  figma.closePlugin();
};
