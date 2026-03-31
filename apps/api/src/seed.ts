import './load-env.js';
import { closeDb, getDb, MongoTagRepository, MongoTaskRepository, MongoUserRepository } from '@dayparty/db';

function todayLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017';
const MONGODB_DB = process.env.MONGODB_DB ?? 'dayparty';
const SEED_EMAIL = (process.env.SEED_EMAIL ?? 'dev@day.party').toLowerCase();

async function main(): Promise<void> {
  const db = await getDb(MONGODB_URI, MONGODB_DB);
  const userRepo = new MongoUserRepository(db);
  const tagRepo = new MongoTagRepository(db);
  const taskRepo = new MongoTaskRepository(db);

  let user = await userRepo.findByEmail(SEED_EMAIL);
  if (!user) {
    user = await userRepo.create({
      email: SEED_EMAIL,
      displayName: 'Local Dev',
      role: 'user',
    });
    console.log(`Created user ${user.email} (${user.id})`);
  } else {
    console.log(`Using existing user ${user.email} (${user.id})`);
  }

  await tagRepo.seedDefaults(user.id);
  console.log('Default tags ensured');

  const date = todayLocal();
  const existing = await taskRepo.findByUserAndDate(user.id, date);
  if (existing.length > 0) {
    if (process.env.SEED_FORCE_TASKS === '1') {
      for (const t of existing) {
        await taskRepo.delete(t.id);
      }
      console.log(`Removed ${existing.length} existing task(s) for ${date} (SEED_FORCE_TASKS)`);
    } else {
      console.log(
        `Skip sample tasks: ${existing.length} already scheduled for ${date} (set SEED_FORCE_TASKS=1 to replace)`,
      );
      await closeDb();
      return;
    }
  }

  const samples: Array<{
    title: string;
    size: 1 | 2 | 3 | 4 | 5;
    tagKey?: string;
    isComplete: boolean;
  }> = [
    { title: 'Revisar rundown matutino', size: 2, tagKey: 'work', isComplete: false },
    { title: 'Caminar 20 minutos', size: 2, tagKey: 'health', isComplete: false },
    { title: 'Planchar camiseta para videollamada', size: 1, tagKey: 'errands', isComplete: true },
    { title: 'Leer un capítulo', size: 3, tagKey: 'hobby', isComplete: false },
  ];

  let position = 0;
  for (const s of samples) {
    await taskRepo.create({
      userId: user.id,
      title: s.title,
      size: s.size,
      tagKey: s.tagKey,
      isComplete: s.isComplete,
      scheduledDate: date,
      position: position++,
    });
  }

  console.log(`Inserted ${samples.length} sample task(s) for ${date}`);

  await closeDb();
}

main().catch(async (err) => {
  console.error(err);
  await closeDb();
  process.exitCode = 1;
});
