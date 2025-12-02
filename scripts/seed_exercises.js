const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('DATABASE_URL is not defined in .env.local');
    process.exit(1);
}

const exercises = [
    // Chest
    { name: 'Bench Press', category: 'Chest', description: 'Lie on a flat bench and press the barbell up from your chest.' },
    { name: 'Push Up', category: 'Chest', description: 'A classic bodyweight exercise starting from a plank position.' },
    { name: 'Incline Bench Press', category: 'Chest', description: 'Press the barbell up from your chest on an inclined bench to target upper chest.' },
    { name: 'Dumbbell Fly', category: 'Chest', description: 'Lie on a bench and spread your arms wide with dumbbells, then bring them together.' },

    // Back
    { name: 'Deadlift', category: 'Back', description: 'Lift a loaded barbell from the ground to the hips, then lower it back down.' },
    { name: 'Pull Up', category: 'Back', description: 'Hang from a bar and pull your body up until your chin is over the bar.' },
    { name: 'Bent Over Row', category: 'Back', description: 'Bend at the hips and pull a barbell towards your lower chest.' },
    { name: 'Lat Pulldown', category: 'Back', description: 'Pull a hanging bar down towards your upper chest while seated.' },

    // Legs
    { name: 'Squat', category: 'Legs', description: 'Lower your hips from a standing position and then stand back up.' },
    { name: 'Lunge', category: 'Legs', description: 'Step forward with one leg and lower your hips until both knees are bent at 90 degrees.' },
    { name: 'Leg Press', category: 'Legs', description: 'Push a weighted platform away from you using your legs while seated.' },
    { name: 'Calf Raise', category: 'Legs', description: 'Raise your heels off the ground while standing or seated.' },

    // Shoulders
    { name: 'Overhead Press', category: 'Shoulders', description: 'Press a barbell or dumbbells from your shoulders up over your head.' },
    { name: 'Lateral Raise', category: 'Shoulders', description: 'Lift dumbbells out to the side until they are at shoulder height.' },
    { name: 'Front Raise', category: 'Shoulders', description: 'Lift dumbbells forward until they are at shoulder height.' },

    // Arms
    { name: 'Bicep Curl', category: 'Arms', description: 'Curl a barbell or dumbbells towards your shoulders.' },
    { name: 'Tricep Extension', category: 'Arms', description: 'Extend your arms to lift a weight, focusing on the triceps.' },
    { name: 'Hammer Curl', category: 'Arms', description: 'Curl dumbbells with your palms facing each other.' },

    // Core
    { name: 'Plank', category: 'Core', description: 'Hold a push-up position, resting on your forearms.' },
    { name: 'Crunch', category: 'Core', description: 'Lie on your back and lift your shoulders off the ground.' },
    { name: 'Leg Raise', category: 'Core', description: 'Lie on your back and lift your legs up towards the ceiling.' }
];

async function seed() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to database');

        console.log('Seeding exercises...');

        for (const exercise of exercises) {
            // Check if exists first to avoid duplicates if run multiple times
            const res = await client.query(
                'SELECT id FROM exercises WHERE name = $1 AND is_custom = false',
                [exercise.name]
            );

            if (res.rows.length === 0) {
                await client.query(
                    'INSERT INTO exercises (name, category, description, is_custom, user_id) VALUES ($1, $2, $3, false, NULL)',
                    [exercise.name, exercise.category, exercise.description]
                );
                console.log(`Added: ${exercise.name}`);
            } else {
                console.log(`Skipped (already exists): ${exercise.name}`);
            }
        }

        console.log('Seeding complete!');

    } catch (err) {
        console.error('Error seeding exercises:', err);
    } finally {
        await client.end();
    }
}

seed();
