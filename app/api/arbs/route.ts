// app/api/arbs/route.ts — v3：active -> odds（后端扁平化返回）
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

const HOST   = process.env.OPTICODDS_API_HOST   || 'https://api.opticodds.com';
const PREFIX = process.env.OPTICODDS_API_PREFIX || '/api/v3';
const KEY    = process.env.OPTICODDS_API_KEY    || '';

const DEFAULT_SPORT = process.env.SPORT_KEY || 'soccer';
const DEFAULT_BOOKS = (process.env.SPORTSBOOKS || '')
  .split(',').map(s=>s.trim()).filter(Boolean);

function headers() {
  return KEY ? { 'Accept': 'application/json', 'X-Api-Key': KEY } : { 'Accept': 'application/json' };
}

async function getActiveFixtures(sport: string, limit = 20) {
  const url = new URL(`${PREFIX}/fixtures/active`, HOST);
  url.searchParams.set('sport', sport);
  const r = await fetch(url.toString(), { headers: headers(), cache: 'no-store' as any, next: { revalidate: 0 } });
  if (!r.ok) throw new Error(`fixtures/active ${r.status} ${await r.text()}`);
  const j = await r.json();
  const list = Array.isArray(j?.data) ? j.data : [];
  return list.slice(0, limit).map((it: any) => it.id); // fixture_id
}

async function getOddsByFixture(fixtureId: string, books: string[]) {
  const url = new URL(`${PREFIX}/fixtures/odds`, HOST);
  url.searchParams.set('fixture_id', fixtureId);
  books.forEach(b => url.searchParams.append('sportsbook', b)); // v3 单数，可多值
  const r = await fetch(url.toString(), { headers: headers(), cache: 'no-store' as any, next: { revalidate: 0 } });
  if (!r.ok) throw new Error(`fixtures/odds ${r.status} ${await r.text()}`);
  return r.json();
}

// 把 fixture 里的 odds[] 扁平化，并补齐比赛信息
function flattenFixtureOdds(entry: any): any[] {
  // 情形 A：返回是 { fixture:{...}, odds:[...] }
  if (entry?.fixture && Array.isArray(entry?.odds)) {
    const fx   = entry.fixture;
    const home = fx.home_team || fx.home?.name || fx.home_competitors?.[0]?.name || fx.homeCompetitors?.[0]?.name;
    const away = fx.away_team || fx.away?.name || fx.away_competitors?.[0]?.name || fx.awayCompetitors?.[0]?.name;
    const start= fx.start_date || fx.start_time || fx.commence_time;

    return entry.odds
      .filter((o:any)=>o)
      .map((o:any) => ({
        fixture_id : fx.id || entry.fixture_id || entry.id,
        start_date : start,
        home_team  : home || '',
        away_team  : away || '',
        market     : (o.market || o.key || '').toLowerCase(),
        line       : o.line ?? o.handicap ?? null,
        selection  : (o.selection || o.outcome || o.name || '').toLowerCase(),
        decimal    : Number(o.decimal ?? o.price ?? o.odds ?? 0),
        sportsbook : o.sportsbook || o.bookmaker || o.book,
        deep_link  : o.deep_link || o.url || o.link
      }))
      .filter((x:any)=>x.market && x.selection && x.decimal > 0);
  }

  // 情形 B：已经是扁平化的一条盘口
  if (entry && (entry.selection || entry.decimal || entry.sportsbook)) {
    return [{
      fixture_id : entry.fixture_id || entry.fixture?.id || entry.id,
      start_date : entry.start_date || entry.start_time || entry.commence_time || entry.fixture?.start_date,
      home_team  : entry.home_team || entry.home || entry.fixture?.home_team,
      away_team  : entry.away_team || entry.away || entry.fixture?.away_team,
      market     : (entry.market || entry.key || '').toLowerCase(),
      line       : entry.line ?? entry.handicap ?? null,
      selection  : (entry.selection || entry.outcome || entry.name || '').toLowerCase(),
      decimal    : Number(entry.decimal ?? entry.price ?? entry.odds ?? 0),
      sportsbook : entry.sportsbook || entry.bookmaker || entry.book,
      deep_link  : entry.deep_link || entry.url || entry.link
    }];
  }

  return [];
}

export async function GET(req: Request) {
  try {
    if (!KEY) return NextResponse.json({ error: 'Missing OPTICODDS_API_KEY' }, { status: 500 });

    const q = new URL(req.url).searchParams;
    const sport   = q.get('sport') || DEFAULT_SPORT;
    const booksCsv= q.get('sportsbooks') || DEFAULT_BOOKS.join(',');
    const books   = booksCsv ? booksCsv.split(',').map(s=>s.trim()).filter(Boolean) : [];

    const fxIds = await getActiveFixtures(sport, 20);
    if (!fxIds.length) {
      return NextResponse.json({ lastUpdated: new Date().toISOString(), payload: { data: [] }, note: 'No active fixtures' });
    }

    const settled = await Promise.allSettled(fxIds.map(id => getOddsByFixture(id, books)));
    const flat:any[] = [];
    for (const s of settled) {
      if (s.status === 'fulfilled') {
        const data = Array.isArray(s.value?.data) ? s.value.data : [];
        for (const entry of data) {
          flat.push(...flattenFixtureOdds(entry));
        }
      }
    }

    return NextResponse.json(
      { lastUpdated: new Date().toISOString(), payload: { data: flat }, endpoint: `${HOST}${PREFIX}` },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Upstream error', detail: e?.message || String(e) },
      { status: 502, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
