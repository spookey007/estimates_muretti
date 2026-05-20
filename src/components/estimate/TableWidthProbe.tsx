"use client";

import type { RefObject } from "react";
import { INPUT, SELECT, TEXTAREA } from "./line-shared";

/** Off-screen probe matching table column mins for layout measurement. */
export function TableWidthProbe({
  tableRef,
  scrollRef,
}: {
  tableRef: RefObject<HTMLTableElement | null>;
  scrollRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={scrollRef}
      aria-hidden
      className="pointer-events-none absolute -left-[10000px] top-0 h-0 overflow-hidden opacity-0"
    >
      <table
        ref={tableRef}
        className="w-max border-collapse text-sm"
        style={{ tableLayout: "fixed" }}
      >
        <thead>
          <tr>
            <th style={{ width: 72 }}>line_id</th>
            <th style={{ width: 128 }}>room</th>
            <th style={{ width: 160 }}>role</th>
            <th style={{ width: 56 }}>qty</th>
            <th style={{ width: 88 }}>height</th>
            <th style={{ width: 88 }}>width</th>
            <th style={{ width: 80 }}>depth</th>
            <th style={{ width: 72 }}>side</th>
            <th style={{ width: 96 }}>depth_type</th>
            <th style={{ width: 224 }}>notes</th>
            <th style={{ width: 112 }}>resolved</th>
            <th style={{ width: 88 }}>code</th>
            <th style={{ width: 72 }}>unit</th>
            <th style={{ width: 72 }}>total</th>
            <th style={{ width: 88 }}>accuracy</th>
            <th style={{ width: 256 }}>why</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>L99</td>
            <td>
              <input className={INPUT} readOnly value="Wall 1 - left run" />
            </td>
            <td>
              <select className={SELECT} defaultValue="corner_upright" disabled tabIndex={-1}>
                <option>corner_upright</option>
              </select>
            </td>
            <td>
              <input className={INPUT} readOnly value="4" />
            </td>
            <td>
              <input className={INPUT} readOnly value="2187" />
            </td>
            <td>
              <input className={INPUT} readOnly value="900" />
            </td>
            <td>
              <input className={INPUT} readOnly value="510" />
            </td>
            <td>
              <input className={INPUT} readOnly value="dx" />
            </td>
            <td>
              <select className={SELECT} defaultValue="510" disabled tabIndex={-1}>
                <option>510</option>
              </select>
            </td>
            <td>
              <textarea
                className={TEXTAREA}
                readOnly
                value="A Montante - sample note text for width probe"
              />
            </td>
            <td>H2187 L903</td>
            <td>1RL1710</td>
            <td>88.00</td>
            <td>176.00</td>
            <td>snapped</td>
            <td>Shelf width 900 mm to catalog 903 mm</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
