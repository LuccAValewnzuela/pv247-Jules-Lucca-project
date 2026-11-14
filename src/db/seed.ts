import { db } from "./client";
import { availabilityBlocks, sessionTypes, users } from "./schema";

// Use your own Google email here (or via env) so you get the therapist role when signing in.
const THERAPIST_EMAIL = process.env.SEED_THERAPIST_EMAIL ?? "therapist@example.com";

const SESSION_TYPES = [
  {
    name: "Initial consultation",
    description: "A first meeting to talk about what brings you here and how we could work together.",
    durationMinutes: 30,
    priceCents: 60000,
  },
  {
    name: "Individual therapy",
    description: "A regular one-on-one therapy session.",
    durationMinutes: 50,
    priceCents: 120000,
  },
  {
    name: "Couples therapy",
    description: "A session for couples working through their relationship together.",
    durationMinutes: 80,
    priceCents: 180000,
  },
];

// Weekday (0 = Sunday) -> working hours [start, end]
const WORKING_HOURS: Record<number, [number, number]> = {
  1: [9, 13],
  2: [13, 18],
  3: [9, 13],
  4: [13, 18],
  5: [9, 13],
};

const atHour = (day: Date, hour: number) => {
  const date = new Date(day);
  date.setHours(hour, 0, 0, 0);
  return date;
};

const nextTwoWeeksBlocks = () => {
  const today = new Date();

  return Array.from({ length: 14 }, (_, i) => {
    const day = new Date(today);
    day.setDate(today.getDate() + i + 1);
    return day;
  }).flatMap(day => {
    const hours = WORKING_HOURS[day.getDay()];
    return hours ? [{ startsAt: atHour(day, hours[0]), endsAt: atHour(day, hours[1]) }] : [];
  });
};

const seed = async () => {
  // Upsert: running the seed again doesn't duplicate the therapist
  await db
    .insert(users)
    .values({ email: THERAPIST_EMAIL, name: "Therapist", role: "therapist" })
    .onConflictDoUpdate({ target: users.email, set: { role: "therapist" } });
  console.log(`Therapist: ${THERAPIST_EMAIL}`);

  // Only filled when empty, so existing data is never touched
  if (!(await db.query.sessionTypes.findFirst())) {
    await db.insert(sessionTypes).values(SESSION_TYPES);
    console.log(`Session types: ${SESSION_TYPES.length} added`);
  } else {
    console.log("Session types: already there, skipped");
  }

  if (!(await db.query.availabilityBlocks.findFirst())) {
    const blocks = nextTwoWeeksBlocks();
    await db.insert(availabilityBlocks).values(blocks);
    console.log(`Availability blocks: ${blocks.length} added`);
  } else {
    console.log("Availability blocks: already there, skipped");
  }
};

seed()
  .then(() => console.log("Seed done"))
  .catch(error => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
