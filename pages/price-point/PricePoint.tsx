import { useState } from "react";
import { NumeralInput } from "./PriceInput";

type Row = {
  id: string;
  price: number;
  unit: number;
  perUnit: number | null;
};

const createRow = (): Row => ({
  id: crypto.randomUUID(),
  price: 0,
  unit: 0,
  perUnit: null,
});

const getPerUnitLabel = (row: Row) =>
  row.perUnit === null ? "--" : row.perUnit.toFixed(4);

export const PricePoint = () => {
  const [rows, setRows] = useState<Row[]>([createRow(), createRow()]);

  const updateRow = (id: string, field: "price" | "unit", value: number) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) {
          return row;
        }

        const next = { ...row, [field]: value } as Row;
        next.perUnit = next.unit !== 0 ? next.price / next.unit : null;
        return next;
      }),
    );
  };

  const addRow = () => {
    setRows((prev) => [...prev, createRow()]);
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
  };

  const resetRow = () => {
    setRows([createRow(), createRow()]);
  };

  const lowestRow = rows.reduce<Row | null>((lowest, row) => {
    if (row.perUnit === null) {
      return lowest;
    }

    if (lowest === null) {
      return row;
    }

    const currentValue = lowest.perUnit;
    if (currentValue === null || row.perUnit < currentValue) {
      return row;
    }

    return lowest;
  }, null);

  return (
    <div className="container">
      <table>
        <thead>
          <tr>
            <th style={{ width: 1 }}></th>
            <th>Price</th>
            <th>Unit</th>
            <th>$/unit</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              style={
                row.id === lowestRow?.id
                  ? { background: "lightgreen" }
                  : undefined
              }
            >
              <td>
                <button
                  className="remove"
                  type="button"
                  onClick={() => removeRow(row.id)}
                  tabIndex={-1}
                >
                  &times;
                </button>
              </td>
              <td>
                <NumeralInput
                  className="field"
                  hasDecimals
                  onChange={(value) => updateRow(row.id, "price", value)}
                />
              </td>
              <td>
                <NumeralInput
                  className="field"
                  hasDecimals={false}
                  onChange={(value) => updateRow(row.id, "unit", value)}
                />
              </td>
              <td>
                <span>{getPerUnitLabel(row)}</span>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4}></td>
          </tr>
        </tfoot>
      </table>
      <div className="actions">
        <button type="button" onClick={addRow}>
          add row
        </button>
        <button type="button" onClick={resetRow}>
          clear all
        </button>
      </div>
    </div>
  );
};
