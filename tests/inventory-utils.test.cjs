const test = require('node:test');
const assert = require('node:assert/strict');
const inventory = require('../.inventory-test-build/services/inventory/inventory-utils.js');

const initial = [
  { slotId: 'slot-01', itemId: 'wood', quantity: 40 },
  { slotId: 'slot-02', itemId: 'stone', quantity: 15 },
  { slotId: 'slot-03', itemId: 'natural_fiber', quantity: 10 },
  { slotId: 'slot-04', itemId: 'canteen', quantity: 1 },
  { slotId: 'slot-05', itemId: 'rope', quantity: 1 },
  { slotId: 'slot-06', itemId: 'flashlight', quantity: 1 },
  { slotId: 'slot-07', itemId: 'basic_tools', quantity: 1 },
];

test('inventário inicial ocupa sete dos doze espaços', () => {
  assert.equal(inventory.calculateUsedSlots(initial), 7);
  assert.equal(inventory.calculateFreeSlots(initial, 12), 5);
});

test('materiais completam pilhas antes de ocupar outro slot', () => {
  const result = inventory.addItemToInventory(initial, 12, 'wood', 70);
  assert.equal(result.remaining, 0);
  assert.deepEqual(result.slots.filter(slot => slot.itemId === 'wood').map(slot => slot.quantity), [100, 10]);
});

test('mochila cheia não aceita um equipamento adicional', () => {
  const full = Array.from({ length: 12 }, (_, index) => ({ slotId: `slot-${index}`, itemId: 'canteen', quantity: 1 }));
  assert.equal(inventory.canAddItem(full, 12, 'rope', 1), false);
});

test('remoção não permite quantidades negativas e normaliza os slots restantes', () => {
  const result = inventory.removeItemFromInventory(initial, 'stone', 10);
  assert.equal(result.removed, 10);
  assert.equal(result.slots.find(slot => slot.itemId === 'stone').quantity, 5);
  assert.equal(inventory.removeItemFromInventory(initial, 'stone', 16).removed, 0);
});

test('normalização divide materiais acima do limite de cem', () => {
  const normalized = inventory.normalizeInventoryStacks([{ slotId: 'legacy', itemId: 'wood', quantity: 130 }]);
  assert.deepEqual(normalized.map(slot => slot.quantity), [100, 30]);
});
