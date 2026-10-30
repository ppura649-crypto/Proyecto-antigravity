// The 40 reels of a guest account, the same invented entries as ReelGridData.ts, in the shape of
// projects/<id>/assets/guest-reels.json (the index is not loadable at render time). Sorted by date: the first is 2025-05-30, the last
// 2026-08-11. `plays` is carried for provenance only; the year strip shows no digit from it.
export type Reel = { code: string; date: string; plays: number; thumb: string };

export const REELS: Reel[] = [
  { code: "XAa1fD0Wqyr", date: "2025-05-30", plays: 1420969, thumb: "reel-XAa1fD0Wqyr.jpg" },
  { code: "XAbMW5HxZuH", date: "2025-06-17", plays: 1159527, thumb: "reel-XAbMW5HxZuH.jpg" },
  { code: "XAcT4n4beIy", date: "2025-10-15", plays: 1563250, thumb: "reel-XAcT4n4beIy.jpg" },
  { code: "XAdRhI6ri7T", date: "2026-05-25", plays: 12843, thumb: "reel-XAdRhI6ri7T.jpg" },
  { code: "XAenAvZ5k1S", date: "2026-05-30", plays: 30045, thumb: "reel-XAenAvZ5k1S.jpg" },
  { code: "XAf4afmx6mE", date: "2026-06-07", plays: 23375, thumb: "reel-XAf4afmx6mE.jpg" },
  { code: "XAgak8fIeIo", date: "2026-06-12", plays: 45485, thumb: "reel-XAgak8fIeIo.jpg" },
  { code: "XAhL1BTGylK", date: "2026-06-13", plays: 8440, thumb: "reel-XAhL1BTGylK.jpg" },
  { code: "XAiHH8Bk9eK", date: "2026-06-18", plays: 7841, thumb: "reel-XAiHH8Bk9eK.jpg" },
  { code: "XAjQrZI4UJT", date: "2026-06-23", plays: 360883, thumb: "reel-XAjQrZI4UJT.jpg" },
  { code: "XAkuDBeacGR", date: "2026-06-26", plays: 104029, thumb: "reel-XAkuDBeacGR.jpg" },
  { code: "XAlEvIsd76H", date: "2026-07-01", plays: 10916, thumb: "reel-XAlEvIsd76H.jpg" },
  { code: "XAmFA15kBQp", date: "2026-07-08", plays: 8149, thumb: "reel-XAmFA15kBQp.jpg" },
  { code: "XAnbpVyQa7F", date: "2026-07-09", plays: 4369, thumb: "reel-XAnbpVyQa7F.jpg" },
  { code: "XAoPj4JoO1N", date: "2026-07-15", plays: 2658, thumb: "reel-XAoPj4JoO1N.jpg" },
  { code: "XApGeAulTHv", date: "2026-07-15", plays: 3988, thumb: "reel-XApGeAulTHv.jpg" },
  { code: "XAqmQ0hNHbK", date: "2026-07-16", plays: 7137, thumb: "reel-XAqmQ0hNHbK.jpg" },
  { code: "XArale1OZ7u", date: "2026-07-16", plays: 14029, thumb: "reel-XArale1OZ7u.jpg" },
  { code: "XAsvjH8wod6", date: "2026-07-17", plays: 4043, thumb: "reel-XAsvjH8wod6.jpg" },
  { code: "XAtX90VibIz", date: "2026-07-17", plays: 3038, thumb: "reel-XAtX90VibIz.jpg" },
  { code: "XAuNFiUZRXz", date: "2026-07-17", plays: 6860, thumb: "reel-XAuNFiUZRXz.jpg" },
  { code: "XAvgDO3y35i", date: "2026-07-17", plays: 4827, thumb: "reel-XAvgDO3y35i.jpg" },
  { code: "XAwZ2bp98OL", date: "2026-07-18", plays: 16406, thumb: "reel-XAwZ2bp98OL.jpg" },
  { code: "XAxOZUkXG6M", date: "2026-07-18", plays: 4035, thumb: "reel-XAxOZUkXG6M.jpg" },
  { code: "XAymDBLodEd", date: "2026-07-18", plays: 2571, thumb: "reel-XAymDBLodEd.jpg" },
  { code: "XAzjp4GRdiy", date: "2026-07-19", plays: 5386, thumb: "reel-XAzjp4GRdiy.jpg" },
  { code: "XA0BXQSQP8d", date: "2026-07-19", plays: 4737, thumb: "reel-XA0BXQSQP8d.jpg" },
  { code: "XA1ionrZJXP", date: "2026-07-20", plays: 50098, thumb: "reel-XA1ionrZJXP.jpg" },
  { code: "XA2qeYMbg5M", date: "2026-07-26", plays: 7954, thumb: "reel-XA2qeYMbg5M.jpg" },
  { code: "XA3uj6AkAem", date: "2026-08-02", plays: 9157, thumb: "reel-XA3uj6AkAem.jpg" },
  { code: "XA4ZiFUGUFu", date: "2026-08-03", plays: 70962, thumb: "reel-XA4ZiFUGUFu.jpg" },
  { code: "XA5UUfu5NKc", date: "2026-08-04", plays: 5085, thumb: "reel-XA5UUfu5NKc.jpg" },
  { code: "XA6ouxel9S2", date: "2026-08-05", plays: 3436, thumb: "reel-XA6ouxel9S2.jpg" },
  { code: "XA7G2ApxiZN", date: "2026-08-05", plays: 10086, thumb: "reel-XA7G2ApxiZN.jpg" },
  { code: "XA858zTD7fW", date: "2026-08-07", plays: 11283, thumb: "reel-XA858zTD7fW.jpg" },
  { code: "XA9ihV9Ccab", date: "2026-08-07", plays: 2136, thumb: "reel-XA9ihV9Ccab.jpg" },
  { code: "XBAvasxwYo0", date: "2026-08-08", plays: 4079, thumb: "reel-XBAvasxwYo0.jpg" },
  { code: "XBBxbXIZQnt", date: "2026-08-08", plays: 8941, thumb: "reel-XBBxbXIZQnt.jpg" },
  { code: "XBC8doE1MLF", date: "2026-08-11", plays: 5554, thumb: "reel-XBC8doE1MLF.jpg" },
  { code: "XBD8dR7SDoL", date: "2026-08-11", plays: 1296, thumb: "reel-XBD8dR7SDoL.jpg" },
];

// the strip runs from the first reel to the day this was cut
export const STRIP_FROM = "2025-05-30";
export const STRIP_TO = "2026-08-21";
