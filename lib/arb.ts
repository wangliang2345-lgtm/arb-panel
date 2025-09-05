export type Outcome = {
  selection: string; // e.g., home/draw/away
  price: number;     // decimal odds
  bookmaker: string;
  deep_link?: string;
};

export type Market = {
  key: string; // ml | 1x2 | spreads | totals (normalized externally)
  line?: number | null;
  outcomes: Outcome[];
};

export type EventRow = {
  eventId: string;
  sport: string;
  league?: string;
  home?: string;
  away?: string;
  startTime?: string;
  markets: Market[];
};

function sumInverse(prices: number[]) {
  return prices.reduce((acc, p) => acc + (1 / p), 0);
}

export function findTwoWayArb(outcomes: Outcome[][]) {
  // outcomes: [ [best for side A...], [best for side B...] ]
  // choose best single price per side (max odds) then compute edge
  if (outcomes.length < 2) return null;
  const bestA = outcomes[0].reduce((a,b)=> a.price>=b.price?a:b);
  const bestB = outcomes[1].reduce((a,b)=> a.price>=b.price?a:b);
  const inv = (1/bestA.price) + (1/bestB.price);
  const edge = (1 - inv) * 100;
  return {edge, picks:[bestA, bestB]};
}

export function findThreeWayArb(outcomes: Outcome[][]) {
  // outcomes: [ [home...], [draw...], [away...] ]
  if (outcomes.length < 3) return null;
  const best = outcomes.map(group => group.reduce((a,b)=> a.price>=b.price?a:b));
  const inv = sumInverse(best.map(o=>o.price));
  const edge = (1 - inv) * 100;
  return {edge, picks: best};
}
