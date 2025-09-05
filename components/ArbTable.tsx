'use client';
import React from 'react';

type Row = {
  id: string;
  sport?: string;
  league?: string;
  start_time?: string;
  home?: string;
  away?: string;
  market?: string;
  line?: string | number | null;
  sideA?: { book?: string; price?: number; link?: string };
  sideB?: { book?: string; price?: number; link?: string };
  sideC?: { book?: string; price?: number; link?: string };
  netPercent?: number; // positive means arb
};

function fmtEdge(v?: number) {
  if (v === undefined || v === null) return '';
  const s = v.toFixed(2) + '%';
  return v > 0 ? <span className="netpos">{s}</span> : <span className="netneg">{s}</span>;
}

export default function ArbTable({ rows, lastUpdated }: {rows: Row[], lastUpdated?: string}) {
  return (
    <div className="card">
      <div className="kpi">
        <div className="pill">Rows: {rows.length}</div>
        <div className="pill">Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : '—'}</div>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Start</th>
            <th>Match</th>
            <th>Market / Line</th>
            <th>Side A</th>
            <th>Side B</th>
            <th>Side C</th>
            <th>Net %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.start_time ? new Date(r.start_time).toLocaleString() : ''}</td>
              <td>{r.home} vs {r.away}</td>
              <td>{r.market}{r.line!==undefined&&r.line!==null?` @ ${r.line}`:''}</td>
              <td>{r.sideA?.book} {r.sideA?.price ? `@ ${r.sideA?.price}`:''} {r.sideA?.link && <a href={r.sideA.link} target="_blank">Go</a>}</td>
              <td>{r.sideB?.book} {r.sideB?.price ? `@ ${r.sideB?.price}`:''} {r.sideB?.link && <a href={r.sideB.link} target="_blank">Go</a>}</td>
              <td>{r.sideC?.book} {r.sideC?.price ? `@ ${r.sideC?.price}`:''} {r.sideC?.link && <a href={r.sideC.link} target="_blank">Go</a>}</td>
              <td>{fmtEdge(r.netPercent)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
