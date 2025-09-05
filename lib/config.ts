export const CONFIG = {
  refreshSeconds: parseInt(process.env.REFRESH_SECONDS || '60', 10),
  sport: process.env.SPORT_KEY || 'soccer',
  sportsbooks: (process.env.SPORTSBOOKS || '').split(',').map(s => s.trim()).filter(Boolean),
};
