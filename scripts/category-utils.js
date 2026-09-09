export function buildCategoryTree(categories = []) {
  const tree = {};

  categories.forEach(category => {
    if (typeof category !== 'string' || !category.trim()) {
      return;
    }

    const separatorIndex = category.indexOf(' / ');
    if (separatorIndex === -1) {
      if (!tree['Other categories']) {
        tree['Other categories'] = [];
      }
      tree['Other categories'].push(category);
      return;
    }

    const group = category.slice(0, separatorIndex);
    const subcategory = category.slice(separatorIndex + 3);
    if (!tree[group]) {
      tree[group] = [];
    }

    tree[group].push(subcategory);
  });

  return tree;
}
