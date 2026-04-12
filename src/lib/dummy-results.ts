export const dummyResults = [
  {
    id: '1',
    athleteName: 'Carlos Mendez',
    eventName: 'Lima Marathon 2025',
    eventDate: '2025-08-15',
    raceCategory: 'Marathon',
    finishTime: 13680,
    overallRank: 142,
    totalFinishers: 1840,
    percentile: 92.3,
    status: 'unclaimed',
  },
  {
    id: '2',
    athleteName: 'Carlos Mendez',
    eventName: 'Miraflores 10K 2025',
    eventDate: '2025-05-20',
    raceCategory: '10K',
    finishTime: 2760,
    overallRank: 38,
    totalFinishers: 620,
    percentile: 93.8,
    status: 'unclaimed',
  },
  {
    id: '3',
    athleteName: 'Carlos Mendez',
    eventName: 'Costa Verde Half Marathon 2024',
    eventDate: '2024-11-10',
    raceCategory: 'Half Marathon',
    finishTime: 6240,
    overallRank: 67,
    totalFinishers: 980,
    percentile: 93.1,
    status: 'unclaimed',
  },
  {
    id: '4',
    athleteName: 'Maria Torres',
    eventName: 'Lima Marathon 2025',
    eventDate: '2025-08-15',
    raceCategory: 'Marathon',
    finishTime: 15480,
    overallRank: 284,
    totalFinishers: 1840,
    percentile: 84.6,
    status: 'unclaimed',
  },
  {
    id: '5',
    athleteName: 'Maria Torres',
    eventName: 'Surco 5K 2025',
    eventDate: '2025-03-08',
    raceCategory: '5K',
    finishTime: 1560,
    overallRank: 12,
    totalFinishers: 340,
    percentile: 96.5,
    status: 'unclaimed',
  },
];

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}