import { useState } from 'react';

import { inputClass } from './Field';

function emptyItem() {
  return { type: 'PART', description: '', quantity: 1, unitPrice: 0 };
}

export function LineItemsEditor({ items, onChange }) {
  const [localItems, setLocalItems] = useState(items.length ? items : [emptyItem()]);

  function update(index, patch) {
    const next = localItems.map((item, i) => (i === index ? { ...item, ...patch } : item));
    setLocalItems(next);
    onChange(next);
  }

  function addRow() {
    const next = [...localItems, emptyItem()];
    setLocalItems(next);
    onChange(next);
  }

  function removeRow(index) {
    const next = localItems.filter((_, i) => i !== index);
    setLocalItems(next);
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-2">
      {localItems.map((item, i) => (
        <div key={i} className="grid grid-cols-12 gap-2">
          <select
            value={item.type}
            onChange={(e) => update(i, { type: e.target.value })}
            className={`${inputClass} col-span-2`}
            aria-label="Item type"
          >
            <option value="LABOR">Labor</option>
            <option value="PART">Part</option>
          </select>
          <input
            value={item.description}
            onChange={(e) => update(i, { description: e.target.value })}
            placeholder="Description"
            className={`${inputClass} col-span-5`}
            aria-label="Description"
          />
          <input
            type="number"
            min="1"
            value={item.quantity}
            onChange={(e) => update(i, { quantity: Number(e.target.value) })}
            className={`${inputClass} col-span-2`}
            aria-label="Quantity"
          />
          <input
            type="number"
            min="0"
            step="0.01"
            value={item.unitPrice}
            onChange={(e) => update(i, { unitPrice: Number(e.target.value) })}
            placeholder="Unit price"
            className={`${inputClass} col-span-2`}
            aria-label="Unit price"
          />
          <button
            type="button"
            onClick={() => removeRow(i)}
            disabled={localItems.length === 1}
            aria-label="Remove item"
            className="col-span-1 rounded-md text-muted-foreground transition-colors hover:text-destructive disabled:opacity-30"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="self-start text-sm font-medium text-accent hover:underline"
      >
        + Add line item
      </button>
    </div>
  );
}
