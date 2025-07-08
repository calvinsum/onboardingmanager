import { DataSource } from 'typeorm';
import { Trainer, TrainerLanguage, TrainerStatus } from '../trainer/entities/trainer.entity';

async function addSelangorTrainer() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [Trainer],
    synchronize: false,
  });

  await dataSource.initialize();
  console.log('📦 Database connected');

  const trainerRepository = dataSource.getRepository(Trainer);

  try {
    // Check if trainer already exists
    const existingTrainer = await trainerRepository.findOne({
      where: { name: 'Ahmad Rahman' }
    });

    if (existingTrainer) {
      console.log('✅ Trainer Ahmad Rahman already exists');
      return;
    }

    // Create new trainer for Selangor + Malay + onsite training
    const trainer = trainerRepository.create({
      name: 'Ahmad Rahman',
      languages: [TrainerLanguage.MALAY, TrainerLanguage.ENGLISH],
      locations: ['Selangor', 'Kuala Lumpur'],
      status: TrainerStatus.ACTIVE,
      createdByManagerId: null // System created
    });

    await trainerRepository.save(trainer);
    console.log('✅ Successfully added trainer Ahmad Rahman for Selangor + Malay training');

  } catch (error) {
    console.error('❌ Error adding trainer:', error);
  } finally {
    await dataSource.destroy();
  }
}

if (require.main === module) {
  addSelangorTrainer().catch(console.error);
}

export default addSelangorTrainer; 