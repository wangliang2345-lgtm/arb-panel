'use client';
import React, { useEffect, useMemo, useState } from 'react';
import ArbTable from '../components/ArbTable';

// ===== v3 解析：payload.data 为“按盘口扁平化的行” =====
function computeRows(payload: any): any[] {
  const out: any[] = [];
  const items = Array.isArray(payload?.data) ? payload.data : [];

  // 以 fixture + market + line 归并，聚合每个选择项的最佳盘口价
  const byKey = new Map<string, any>();

  for (const it of items) {
    // 尽量容错各种字段名（不同运动/供应商返回略有差异）
    const fxId   = it.fixture_id || it.fixtureId || it.fixture?.id || it.id;
    const start  = it.start_date || it.commence_time || it.start_time || it.fixture?.start_date;
    const home   = it.home_team || it.home || it.fixture?.home_team;
    const away   = it.away_team || it.away || it.fixture?.away_team;

    const market = String(it.market || it.key || '').toLowerCase();    // moneyline / spreads / totals / asian_...
    const line   = it.line ?? it.handicap ?? null;

    const sb     = it.sportsbook || it.bookmaker || it.book;
    const sel    = String(it.selection || it.outcome || it.name || '').toLowerCase(); // home/draw/away/over/under...
    const price  = Number(it.decimal ?? it.price ?? it.odds ?? 0);
    const link   = it.deep_link || it.url || it.link;

    if (!fxId || !market || !sel || !price) continue;

    const key = `${fxId}|${market}|${line ?? 'nl'}`;
    if (!byKey.has(key)) {
      byKey.set(key, {
        id: `${fxId}-${market}-${line ?? 'nl'}`,
        start_time: start || null,
        home: home || '',
        away: away || '',
        market,
        line,
        groups: {} as Record<string, {book:string, price:number, link?:string}[]>
      });
    }
    const node = byKey.get(key)!;
    node.groups[sel] ??= [];
    node.groups[sel].push({ book: sb, price, link });
  }

  // 组装三边最高价 + 简易净利%
  for (const v of byKey.values()) {
    const ids = Object.keys(v.groups);
    if (!ids.length) continue;

    const best = (name?: string) => {
      const arr = name ? v.groups[name] : undefined;
      return arr && arr.length ? arr.sort((a,b)=>b.price-a.price)[0] : undefined;
    };

    const sides = [ids[0], ids[1], ids[2]];
    const row: any = {
      id: v.id,
      start_time: v.start_time,
      home: v.home,
      away: v.away,
      market: v.market,
      line: v.line,
      sideA: best(sides[0]),
      sideB: best(sides[1]),
      sideC: best(sides[2])
    };

    const prices = [row.sideA?.price, row.sideB?.price, row.sideC?.price].filter(Boolean) as number[];
    if (prices.length === 2) {
      const inv = 1/prices[0] + 1/prices[1];
      row.netPercent = (1 - inv) * 100;
    } else if (prices.length === 3) {
      const inv = 1/prices[0] + 1/prices[1] + 1/prices[2];
      row.netPercent = (1 - inv) * 100;
    }
    out.push(row);
  }

  // 可按净利排序，正数优先
  out.sort((a,b)=>(b.netPercent ?? -999) - (a.netPercent ?? -999));
  return out;
}

type ApiOk = { lastUpdated: string; payload: any };
type ApiErr = { error?: string; status?: number; detail?: any; requested?: string; auth?: string };

export default function Page() {
  const [sport, setSport] = useState('soccer');
  const [books, setBooks] = useState('Pinnacle,Cloudbet');

  const [data, setData] = useState<ApiOk | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const qs = new URLSearchParams({
        sport,
        sportsbooks: books,  // 后端会把 CSV 拆成多个 sportsbook 参数（v3 单数）
      });
      const res = await fetch(`/api/arbs?${qs.toString()}`, { cache: 'no-store' });
      const j: ApiOk | ApiErr = await res.json();

      if (!res.ok) {
        // 把上游原文错误透出（避免“点了没反应”的假象）
        const detail =
          typeof (j as ApiErr)?.detail === 'string'
            ? (j as ApiErr).detail
            : JSON.stringify((j as ApiErr)?.detail ?? j);
        setErr(`Upstream ${ (j as ApiErr).status ?? res.status } — ${detail}`);
        setData(null);
      } else {
        setData(j as ApiOk);
      }
    } catch (e: any) {
      setErr(e?.message || 'Unknown error');
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // 初次自动加载

  const rows = useMemo(() => (data ? computeRows((data as ApiOk).payload) : []), [data]);

  return (
    <div className="container">
      <h1>ArbWire — Pre-Match Arbitrage</h1>

      <div className="card" style={{marginBottom:12}}>
        <div className="row">
          <input
            className="input"
            placeholder="sport (e.g., soccer)"
            value={sport}
            onChange={e=>setSport(e.target.value)}
          />
          <input
            className="input"
            style={{minWidth:320}}
            placeholder="sportsbooks CSV (e.g., Pinnacle,Cloudbet)"
            value={books}
            onChange={e=>setBooks(e.target.value)}
          />
          <button className="btn" onClick={load} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
          {err && <span className="badge" style={{borderColor:'#f97316', color:'#f97316'}}>Error: {err}</span>}
        </div>
      </div>

      <ArbTable rows={rows} lastUpdated={data?.lastUpdated} />

      <p style={{opacity:.7, marginTop:10}}>
        Tip: positive <span className="netpos">Net %</span> indicates a potential arb (before commissions/FX).
      </p>
    </div>
  );
}
