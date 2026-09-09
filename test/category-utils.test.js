import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCategoryTree } from '../scripts/category-utils.js';

test('buildCategoryTree turns flat category strings into nested parent/subcategory groups', () => {
  const categories = [
    'Addons / Furniture Addons',
    'Addons / Building/Structure Addons',
    'Texture Packs / Animated Texture Packs'
  ];

  const tree = buildCategoryTree(categories);
  assert.equal(tree.Addons.length, 2);
  assert.equal(tree['Texture Packs'].length, 1);
  assert.deepEqual(tree.Addons[0], 'Furniture Addons');
});
