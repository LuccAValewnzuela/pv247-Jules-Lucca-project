import { db } from './client';
import {
	availabilityBlocks,
	blogCategories,
	blogPosts,
	bookings,
	clientNotes,
	clients,
	contactMessages,
	account,
	session,
	sessionTypes,
	settings,
	user,
	verification
} from './schema';

// Usage:
//   npm run db:seed              -> fills an empty database, does nothing otherwise
//   npm run db:seed -- --reset   -> wipes every table and seeds again (local DB only)

const RESET = process.argv.includes('--reset');

// Use your own Google email (via env) so you get the therapist role when signing in.
const THERAPIST_EMAIL = (
	process.env.SEED_THERAPIST_EMAIL ?? 'therapist@example.com'
).toLowerCase();

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// --- Dates, always relative to today so there is a past and a future ---

const atDay = (dayOffset: number, hour: number, minute = 0) => {
	const date = new Date();
	date.setDate(date.getDate() + dayOffset);
	date.setHours(hour, minute, 0, 0);
	return date;
};

const addMinutes = (date: Date, minutes: number) =>
	new Date(date.getTime() + minutes * 60_000);

// Weekday (0 = Sunday) -> working hours [start, end]
const WORKING_HOURS: Record<number, [number, number]> = {
	1: [9, 13],
	2: [13, 18],
	3: [9, 13],
	4: [13, 18],
	5: [9, 13]
};

// Two weeks back and two weeks ahead, weekdays only
const blockDays = () =>
	Array.from({ length: 29 }, (_, i) => i - 14)
		.filter(offset => offset !== 0)
		.flatMap(offset => {
			const hours = WORKING_HOURS[atDay(offset, 0).getDay()];
			return hours
				? [
						{
							startsAt: atDay(offset, hours[0]),
							endsAt: atDay(offset, hours[1])
						}
					]
				: [];
		});

const videoCallUrl = () =>
	`https://meet.jit.si/therapy-${crypto.randomUUID().slice(0, 8)}`;

// --- Safety ---

const isLocalDatabase = (url: string) =>
	url.startsWith('file:') ||
	/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/.test(url);

// --- Seeding ---

const resetAll = async (tx: Tx) => {
	// Children first, so foreign keys never block a delete
	await tx.delete(bookings);
	await tx.delete(clientNotes);
	await tx.delete(clients);
	await tx.delete(session);
	await tx.delete(account);
	await tx.delete(verification);
	await tx.delete(user);
	await tx.delete(availabilityBlocks);
	await tx.delete(sessionTypes);
	await tx.delete(blogPosts);
	await tx.delete(blogCategories);
	await tx.delete(contactMessages);
	await tx.delete(settings);
};

const seedAll = async (tx: Tx) => {
	await tx.insert(settings).values({
		businessName: 'Therapy Practice',
		iban: 'CZ6508000000192000145399',
		bankAccount: '19-2000145399/0800',
		bankName: 'Česká spořitelna'
	});

	// Users: the therapist and three clients with an account
	const [, annaUser, tomasUser, martinUser] = await tx
		.insert(user)
		.values(
			[
				{
					email: THERAPIST_EMAIL,
					name: 'Therapist',
					role: 'therapist' as const
				},
				{ email: 'anna.novakova@example.com', name: 'Anna Nováková' },
				{ email: 'tomas.dvorak@example.com', name: 'Tomáš Dvořák' },
				{ email: 'martin.svoboda@example.com', name: 'Martin Svoboda' }
			].map(row => ({
				...row,
				id: crypto.randomUUID(),
				emailVerified: true
			}))
		)
		.returning();

	// Clients: three linked to an account, two created by the therapist
	const [anna, tomas, martin, petra, jan] = await tx
		.insert(clients)
		.values([
			{ userId: annaUser.id, name: annaUser.name, email: annaUser.email },
			{ userId: tomasUser.id, name: tomasUser.name, email: tomasUser.email },
			{
				userId: martinUser.id,
				name: martinUser.name,
				email: martinUser.email
			},
			{
				name: 'Petra Černá',
				email: 'petra.cerna@example.com',
				phone: '+420 777 123 456'
			},
			{ name: 'Jan Procházka', email: 'jan.prochazka@example.com' }
		])
		.returning();

	const [consultation, individual, couples] = await tx
		.insert(sessionTypes)
		.values([
			{
				name: 'Initial consultation',
				description:
					'A first meeting to talk about what brings you here and how we could work together.',
				durationMinutes: 30,
				priceCents: 60000
			},
			{
				name: 'Individual therapy',
				description: 'A regular one-on-one therapy session.',
				durationMinutes: 50,
				priceCents: 120000
			},
			{
				name: 'Couples therapy',
				description:
					'A session for couples working through their relationship together.',
				durationMinutes: 80,
				priceCents: 180000
			}
		])
		.returning();

	const blocks = await tx
		.insert(availabilityBlocks)
		.values(blockDays())
		.returning();
	const now = new Date();
	const past = blocks.filter(block => block.endsAt < now);
	const upcoming = blocks.filter(block => block.startsAt > now);

	// A booking inside a block, starting `hourOffset` hours after the block opens
	const slot = (
		block: (typeof blocks)[number],
		hourOffset: number,
		type: typeof individual
	) => {
		const startsAt = addMinutes(block.startsAt, hourOffset * 60);
		return {
			availabilityBlockId: block.id,
			sessionTypeId: type.id,
			priceCents: type.priceCents,
			startsAt,
			endsAt: addMinutes(startsAt, type.durationMinutes)
		};
	};

	const [rescheduledOriginal] = await tx
		.insert(bookings)
		.values({
			...slot(upcoming[0], 1, individual),
			clientId: martin.id,
			format: 'in_person',
			status: 'cancelled',
			cancelledBy: 'therapist',
			cancelledAt: addMinutes(now, -60 * 24)
		})
		.returning();

	const bookingRows = [
		// Past
		{
			...slot(past[0], 0, individual),
			clientId: anna.id,
			format: 'in_person' as const,
			status: 'completed' as const
		},
		{
			...slot(past[3], 1, individual),
			clientId: anna.id,
			format: 'online' as const,
			status: 'completed' as const,
			videoCallUrl: videoCallUrl()
		},
		{
			...slot(past[5], 0, consultation),
			clientId: tomas.id,
			format: 'in_person' as const,
			status: 'completed' as const
		},
		{
			...slot(past[7], 1, couples),
			clientId: petra.id,
			format: 'in_person' as const,
			status: 'completed' as const,
			notes: 'Came with her partner.'
		},
		{
			...slot(past[8], 2, individual),
			clientId: martin.id,
			format: 'online' as const,
			status: 'cancelled' as const,
			cancelledBy: 'client' as const,
			cancelledAt: addMinutes(past[8].startsAt, -60 * 24 * 3)
		},
		// Upcoming
		{
			...slot(upcoming[1], 0, individual),
			clientId: anna.id,
			format: 'online' as const,
			status: 'confirmed' as const,
			videoCallUrl: videoCallUrl()
		},
		{
			...slot(upcoming[2], 1, individual),
			clientId: tomas.id,
			format: 'in_person' as const,
			status: 'confirmed' as const
		},
		{
			...slot(upcoming[4], 0, consultation),
			clientId: martin.id,
			format: 'online' as const,
			status: 'pending' as const
		},
		{
			...slot(upcoming[6], 2, individual),
			clientId: jan.id,
			format: 'in_person' as const,
			status: 'pending' as const
		},
		{
			...slot(upcoming[7], 0, consultation),
			clientId: petra.id,
			format: 'online' as const,
			status: 'cancelled' as const,
			cancelledBy: 'therapist' as const,
			cancelledAt: now
		},
		// The new booking for the rescheduled one above
		{
			...slot(upcoming[5], 1, individual),
			clientId: martin.id,
			format: 'in_person' as const,
			status: 'confirmed' as const,
			rescheduledFromId: rescheduledOriginal.id
		}
	];
	await tx.insert(bookings).values(bookingRows);

	await tx.insert(clientNotes).values([
		{
			clientId: anna.id,
			noteDate: past[0].startsAt,
			content:
				'First session. Talked about stress at work and trouble sleeping.'
		},
		{
			clientId: anna.id,
			noteDate: past[3].startsAt,
			content: 'Sleep is better. Will keep working on setting boundaries.'
		},
		{
			clientId: tomas.id,
			noteDate: past[5].startsAt,
			content: 'Initial consultation, agreed on weekly sessions.'
		}
	]);

	const [anxiety, relationships, selfCare] = await tx
		.insert(blogCategories)
		.values([
			{ name: 'Anxiety', slug: 'anxiety' },
			{ name: 'Relationships', slug: 'relationships' },
			{ name: 'Self-care', slug: 'self-care' }
		])
		.returning();

	await tx.insert(blogPosts).values([
		{
			title: 'What to expect from your first session',
			slug: 'first-session',
			excerpt: 'A short guide to the first meeting.',
			content:
				'The first session is mostly about getting to know each other. We talk about what brings you here and what you would like to change.',
			categoryId: selfCare.id,
			isPublic: true,
			publishedAt: atDay(-30, 10)
		},
		{
			title: 'Five ways to calm down when anxiety hits',
			slug: 'calm-down-anxiety',
			excerpt: 'Simple techniques you can use anywhere.',
			content:
				'Slow breathing, naming what you see around you, and moving your body can all help bring anxiety down.',
			categoryId: anxiety.id,
			isPublic: true,
			publishedAt: atDay(-20, 10)
		},
		{
			title: 'Talking about difficult topics as a couple',
			slug: 'difficult-topics-couple',
			excerpt: 'How to keep a hard conversation from turning into a fight.',
			content:
				'Pick a calm moment, speak about how you feel rather than what the other did, and take breaks when it gets too heated.',
			categoryId: relationships.id,
			isPublic: true,
			publishedAt: atDay(-10, 10)
		},
		{
			title: 'Why sleep matters for your mental health',
			slug: 'sleep-mental-health',
			excerpt: 'Sleep and mood are closely linked.',
			content:
				'A regular sleep schedule is one of the easiest things you can do for your mood and energy.',
			categoryId: selfCare.id,
			isPublic: true,
			publishedAt: atDay(-3, 10)
		},
		{
			title: 'Panic attacks: a longer guide (draft)',
			slug: 'panic-attacks-guide',
			excerpt: 'Work in progress.',
			content: 'Draft, not published yet.',
			categoryId: anxiety.id,
			isPublic: false
		}
	]);

	await tx.insert(contactMessages).values([
		{
			name: 'Eva Malá',
			email: 'eva.mala@example.com',
			message: 'Hello, do you also offer sessions in English?',
			handledAt: atDay(-2, 15)
		},
		{
			name: 'Karel Novotný',
			email: 'karel.novotny@example.com',
			message: 'Is it possible to book a session on a Saturday?'
		}
	]);

	return {
		users: 4,
		clients: 5,
		sessionTypes: 3,
		availabilityBlocks: blocks.length,
		bookings: bookingRows.length + 1,
		clientNotes: 3,
		blogCategories: 3,
		blogPosts: 5,
		contactMessages: 2
	};
};

const main = async () => {
	const url = process.env.DATABASE_URL ?? '';

	if (RESET && !isLocalDatabase(url)) {
		throw new Error(
			`Refusing to reset a non-local database (${url}). --reset only works on a local DB.`
		);
	}

	const summary = await db.transaction(async tx => {
		if (RESET) {
			await resetAll(tx);
		} else if (await tx.query.user.findFirst()) {
			return null;
		}
		return seedAll(tx);
	});

	if (!summary) {
		console.log(
			'Database already has data, nothing seeded. Use `npm run db:seed -- --reset` to start over.'
		);
		return;
	}

	console.log(RESET ? 'Database reset and seeded:' : 'Database seeded:');
	console.table(summary);
	console.log(`Therapist account: ${THERAPIST_EMAIL}`);
};

main().catch(error => {
	console.error('Seed failed:', error);
	process.exit(1);
});
