import { db } from './index';
import { athletes, results } from './schema';

// Helper — keep times in seconds so they match the schema.
const h = (hh: number, mm: number, ss: number) => hh * 3600 + mm * 60 + ss;

async function main() {
  console.log('Clearing existing rows...');
  // Delete results first because it references athletes.
  await db.delete(results);
  await db.delete(athletes);

  console.log('Inserting athletes...');
  const inserted = await db
    .insert(athletes)
    .values([
      {
        name: 'Carlos Mendez',
        email: 'carlos.mendez@example.com',
        gender: 'M',
        location: 'Lima, Peru',
        xp: 320,
      },
      {
        name: 'Maria Torres',
        email: 'maria.torres@example.com',
        gender: 'F',
        location: 'Lima, Peru',
        xp: 180,
      },
      {
        name: 'Sofia Rivera',
        email: 'sofia.rivera@example.com',
        gender: 'F',
        location: 'Arequipa, Peru',
        xp: 95,
      },
      {
        name: 'Diego Alvarez',
        email: 'diego.alvarez@example.com',
        gender: 'M',
        location: 'Cusco, Peru',
        xp: 240,
      },
      {
        name: 'Lucia Vargas',
        email: 'lucia.vargas@example.com',
        gender: 'F',
        location: 'Trujillo, Peru',
        xp: 60,
      },
    ])
    .returning();

  const byName = Object.fromEntries(inserted.map((a) => [a.name, a.id]));

  console.log('Inserting results...');
  await db.insert(results).values([
    // Carlos
    {
      athleteId: byName['Carlos Mendez'],
      eventName: 'Lima Marathon 2025',
      eventDate: new Date('2025-08-15'),
      raceCategory: 'Marathon',
      finishTime: h(3, 48, 0),
      overallRank: 142,
      totalFinishers: 1840,
      percentile: '92.30',
      status: 'unclaimed',
    },
    {
      athleteId: byName['Carlos Mendez'],
      eventName: 'Miraflores 10K 2025',
      eventDate: new Date('2025-05-20'),
      raceCategory: '10K',
      finishTime: h(0, 46, 0),
      overallRank: 38,
      totalFinishers: 620,
      percentile: '93.80',
      status: 'unclaimed',
    },
    {
      athleteId: byName['Carlos Mendez'],
      eventName: 'Costa Verde Half Marathon 2024',
      eventDate: new Date('2024-11-10'),
      raceCategory: 'Half Marathon',
      finishTime: h(1, 44, 0),
      overallRank: 67,
      totalFinishers: 980,
      percentile: '93.10',
      status: 'unclaimed',
    },
    // Maria
    {
      athleteId: byName['Maria Torres'],
      eventName: 'Lima Marathon 2025',
      eventDate: new Date('2025-08-15'),
      raceCategory: 'Marathon',
      finishTime: h(4, 18, 0),
      overallRank: 284,
      totalFinishers: 1840,
      percentile: '84.60',
      status: 'unclaimed',
    },
    {
      athleteId: byName['Maria Torres'],
      eventName: 'Surco 5K 2025',
      eventDate: new Date('2025-03-08'),
      raceCategory: '5K',
      finishTime: h(0, 26, 0),
      overallRank: 12,
      totalFinishers: 340,
      percentile: '96.50',
      status: 'unclaimed',
    },
    // Sofia
    {
      athleteId: byName['Sofia Rivera'],
      eventName: 'Arequipa Trail 21K 2025',
      eventDate: new Date('2025-06-12'),
      raceCategory: 'Trail',
      finishTime: h(2, 9, 30),
      overallRank: 54,
      totalFinishers: 410,
      percentile: '86.90',
      status: 'unclaimed',
    },
    // Diego
    {
      athleteId: byName['Diego Alvarez'],
      eventName: 'Cusco Altitude 10K 2025',
      eventDate: new Date('2025-07-04'),
      raceCategory: '10K',
      finishTime: h(0, 52, 15),
      overallRank: 22,
      totalFinishers: 290,
      percentile: '92.40',
      status: 'unclaimed',
    },
    {
      athleteId: byName['Diego Alvarez'],
      eventName: 'Lima Marathon 2025',
      eventDate: new Date('2025-08-15'),
      raceCategory: 'Marathon',
      finishTime: h(3, 32, 0),
      overallRank: 88,
      totalFinishers: 1840,
      percentile: '95.20',
      status: 'unclaimed',
    },
    // Lucia
    {
      athleteId: byName['Lucia Vargas'],
      eventName: 'Trujillo 5K 2025',
      eventDate: new Date('2025-04-19'),
      raceCategory: '5K',
      finishTime: h(0, 28, 30),
      overallRank: 41,
      totalFinishers: 280,
      percentile: '85.40',
      status: 'unclaimed',
    },
    {
      athleteId: byName['Lucia Vargas'],
      eventName: 'Costa Verde Half Marathon 2024',
      eventDate: new Date('2024-11-10'),
      raceCategory: 'Half Marathon',
      finishTime: h(2, 3, 15),
      overallRank: 312,
      totalFinishers: 980,
      percentile: '68.20',
      status: 'unclaimed',
    },
  ]);

  const allResults = await db.select().from(results);
  console.log(
    `Seed complete. ${inserted.length} athletes, ${allResults.length} results.`,
  );
  // Drop the connection so the script exits cleanly.
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
