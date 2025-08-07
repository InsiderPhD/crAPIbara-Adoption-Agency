import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.pet.deleteMany();
  await prisma.user.deleteMany();
  await prisma.rescue.deleteMany();

  // Create rescues
  const rescues = await Promise.all([
    prisma.rescue.create({
      data: {
        name: 'Capybara Haven',
        location: 'San Diego, CA',
        contactEmail: 'capyhaven@example.com',
        description: 'A sanctuary dedicated to capybaras and their well-being.',
        websiteUrl: 'https://capyhaven.example.com',
        registrationNumber: 'CA123456',
        logoUrl: 'http://localhost:4000/images/logo.png'
      }
    }),
    prisma.rescue.create({
      data: {
        name: 'Guinea Pig Paradise',
        location: 'Portland, OR',
        contactEmail: 'guineapigparadise@example.com',
        description: 'Specializing in guinea pig rescue and rehabilitation.',
        websiteUrl: 'https://guineapigparadise.example.com',
        registrationNumber: 'OR789012',
        logoUrl: 'http://localhost:4000/images/logo.png'
      }
    }),
    prisma.rescue.create({
      data: {
        name: 'Rocky Mountain Cavies',
        location: 'Denver, CO',
        contactEmail: 'rockycavies@example.com',
        description: 'Rescue and rehabilitation center for rock cavies.',
        websiteUrl: 'https://rockycavies.example.com',
        registrationNumber: 'CO345678',
        logoUrl: 'http://localhost:4000/images/logo.png'
      }
    })
  ]);

  // Password hashes
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const rescuePasswordHash = await bcrypt.hash('rescue123', 10);
  const userPasswordHash = await bcrypt.hash('user123', 10);

  // Create admin user
  await prisma.user.create({
    data: {
      email: 'admin@example.com',
      username: 'admin',
      passwordHash: adminPasswordHash,
      role: 'admin'
    }
  });

  // Create rescue users (one for each rescue)
  await Promise.all([
    prisma.user.create({
      data: {
        email: 'rescue1@example.com',
        username: 'rescue1',
        passwordHash: rescuePasswordHash,
        role: 'rescue',
        rescueId: rescues[0].id
      }
    }),
    prisma.user.create({
      data: {
        email: 'rescue2@example.com',
        username: 'rescue2',
        passwordHash: rescuePasswordHash,
        role: 'rescue',
        rescueId: rescues[1].id
      }
    }),
    prisma.user.create({
      data: {
        email: 'rescue3@example.com',
        username: 'rescue3',
        passwordHash: rescuePasswordHash,
        role: 'rescue',
        rescueId: rescues[2].id
      }
    })
  ]);

  // Create two normal users
  await Promise.all([
    prisma.user.create({
      data: {
        email: 'user1@example.com',
        username: 'user1',
        passwordHash: userPasswordHash,
        role: 'user'
      }
    }),
    prisma.user.create({
      data: {
        email: 'user2@example.com',
        username: 'user2',
        passwordHash: userPasswordHash,
        role: 'user'
      }
    })
  ]);

  // Create pets
  const pets = [
    // Capybaras
    {
      name: 'Carlos',
      species: 'capybara',
      age: 3,
      size: 'large',
      description: 'Friendly and sociable capybara who loves swimming.',
      imageUrl: 'http://localhost:4000/images/istockphoto-2168607576-2048x2048.jpg',
      gallery: JSON.stringify([
        'http://localhost:4000/images/istockphoto-2180358640-2048x2048.jpg',
        'http://localhost:4000/images/istockphoto-1400764745-2048x2048.jpg'
      ]),
      rescueId: rescues[0].id
    },
    {
      name: 'Carla',
      species: 'capybara',
      age: 2,
      size: 'large',
      description: 'Playful capybara who enjoys sunbathing.',
      imageUrl: 'http://localhost:4000/images/istockphoto-500870818-2048x2048.jpg',
      gallery: JSON.stringify([
        'http://localhost:4000/images/istockphoto-477887661-2048x2048.jpg',
        'http://localhost:4000/images/istockphoto-1418210562-2048x2048.jpg'
      ]),
      rescueId: rescues[0].id
    },
    {
      name: 'Chip',
      species: 'capybara',
      age: 1,
      size: 'medium',
      description: 'Young capybara learning to swim.',
      imageUrl: 'http://localhost:4000/images/istockphoto-1201693169-2048x2048.jpg',
      gallery: JSON.stringify([
        'http://localhost:4000/images/istockphoto-1189804267-2048x2048.jpg',
        'http://localhost:4000/images/istockphoto-619629046-2048x2048.jpg'
      ]),
      rescueId: rescues[0].id
    },
    {
      name: 'Coco',
      species: 'capybara',
      age: 4,
      size: 'extra_large',
      description: 'Senior capybara who loves attention.',
      imageUrl: 'http://localhost:4000/images/istockphoto-2180531959-2048x2048.jpg',
      gallery: JSON.stringify([
        'http://localhost:4000/images/istockphoto-1469952166-2048x2048.jpg',
        'http://localhost:4000/images/istockphoto-174967983-2048x2048.jpg'
      ]),
      rescueId: rescues[0].id
    },
    {
      name: 'Cindy',
      species: 'capybara',
      age: 2,
      size: 'large',
      description: 'Active capybara who loves to play.',
      imageUrl: 'http://localhost:4000/images/istockphoto-1845758911-2048x2048.jpg',
      gallery: JSON.stringify([
        'http://localhost:4000/images/istockphoto-482729000-2048x2048.jpg',
        'http://localhost:4000/images/istockphoto-1305264109-2048x2048.jpg'
      ]),
      rescueId: rescues[0].id
    },
    // Guinea Pigs
    {
      name: 'Ginger',
      species: 'guinea_pig',
      age: 1,
      size: 'small',
      description: 'Sweet guinea pig who loves cuddles.',
      imageUrl: 'http://localhost:4000/images/istockphoto-1902983362-2048x2048.jpg',
      gallery: JSON.stringify([
        'http://localhost:4000/images/istockphoto-177228186-2048x2048.jpg',
        'http://localhost:4000/images/istockphoto-1336271516-2048x2048.jpg'
      ]),
      rescueId: rescues[1].id
    },
    {
      name: 'Gus',
      species: 'guinea_pig',
      age: 2,
      size: 'small',
      description: 'Energetic guinea pig who loves to run.',
      imageUrl: 'http://localhost:4000/images/istockphoto-1144425951-2048x2048.jpg',
      gallery: JSON.stringify([
        'http://localhost:4000/images/istockphoto-1201502412-2048x2048.jpg',
        'http://localhost:4000/images/istockphoto-1336271548-2048x2048.jpg'
      ]),
      rescueId: rescues[1].id
    },
    {
      name: 'Gracie',
      species: 'guinea_pig',
      age: 1,
      size: 'small',
      description: 'Shy guinea pig who needs a patient home.',
      imageUrl: 'http://localhost:4000/images/istockphoto-1466629833-2048x2048.jpg',
      gallery: JSON.stringify([
        'http://localhost:4000/images/istockphoto-1354075044-2048x2048.jpg',
        'http://localhost:4000/images/istockphoto-185135075-2048x2048.jpg'
      ]),
      rescueId: rescues[1].id
    },
    {
      name: 'George',
      species: 'guinea_pig',
      age: 3,
      size: 'small',
      description: 'Friendly guinea pig who loves treats.',
      imageUrl: 'http://localhost:4000/images/istockphoto-2164062189-2048x2048.jpg',
      gallery: JSON.stringify([
        'http://localhost:4000/images/istockphoto-628986384-2048x2048.jpg',
        'http://localhost:4000/images/istockphoto-1396607661-2048x2048.jpg'
      ]),
      rescueId: rescues[1].id
    },
    {
      name: 'Gigi',
      species: 'guinea_pig',
      age: 2,
      size: 'small',
      description: 'Playful guinea pig who loves to explore.',
      imageUrl: 'http://localhost:4000/images/istockphoto-1396607661-2048x2048-2.jpg',
      gallery: JSON.stringify([
        'http://localhost:4000/images/istockphoto-173628116-2048x2048.jpg',
        'http://localhost:4000/images/istockphoto-2169701403-2048x2048.jpg'
      ]),
      rescueId: rescues[1].id
    },
    // Rock Cavies
    {
      name: 'Rocky',
      species: 'rock_cavy',
      age: 2,
      size: 'medium',
      description: 'Adventurous rock cavy who loves climbing.',
      imageUrl: 'http://localhost:4000/images/istockphoto-1466629833-2048x2048.jpg',
      gallery: JSON.stringify([
        'http://localhost:4000/images/istockphoto-1354075044-2048x2048.jpg',
        'http://localhost:4000/images/istockphoto-185135075-2048x2048.jpg'
      ]),
      rescueId: rescues[2].id
    },
    {
      name: 'Rita',
      species: 'rock_cavy',
      age: 1,
      size: 'medium',
      description: 'Curious rock cavy who loves to explore.',
      imageUrl: 'http://localhost:4000/images/istockphoto-1354075044-2048x2048.jpg',
      gallery: JSON.stringify([
        'http://localhost:4000/images/istockphoto-1466629833-2048x2048.jpg',
        'http://localhost:4000/images/istockphoto-185135075-2048x2048.jpg'
      ]),
      rescueId: rescues[2].id
    },
    {
      name: 'Rex',
      species: 'rock_cavy',
      age: 3,
      size: 'medium',
      description: 'Confident rock cavy who loves attention.',
      imageUrl: 'http://localhost:4000/images/istockphoto-185135075-2048x2048.jpg',
      gallery: JSON.stringify([
        'http://localhost:4000/images/istockphoto-1466629833-2048x2048.jpg',
        'http://localhost:4000/images/istockphoto-1354075044-2048x2048.jpg'
      ]),
      rescueId: rescues[2].id
    },
    {
      name: 'Ruby',
      species: 'rock_cavy',
      age: 2,
      size: 'medium',
      description: 'Sweet rock cavy who loves to cuddle.',
      imageUrl: 'http://localhost:4000/images/istockphoto-1466629833-2048x2048.jpg',
      gallery: JSON.stringify([
        'http://localhost:4000/images/istockphoto-1354075044-2048x2048.jpg',
        'http://localhost:4000/images/istockphoto-185135075-2048x2048.jpg'
      ]),
      rescueId: rescues[2].id
    },
    {
      name: 'Rocco',
      species: 'rock_cavy',
      age: 1,
      size: 'medium',
      description: 'Energetic rock cavy who loves to play.',
      imageUrl: 'http://localhost:4000/images/istockphoto-1354075044-2048x2048.jpg',
      gallery: JSON.stringify([
        'http://localhost:4000/images/istockphoto-1466629833-2048x2048.jpg',
        'http://localhost:4000/images/istockphoto-185135075-2048x2048.jpg'
      ]),
      rescueId: rescues[2].id
    }
  ];

  // Create pets with reference numbers
  for (const pet of pets) {
    await prisma.pet.create({
      data: {
        ...pet,
        referenceNumber: `PET-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      }
    });
  }

  console.log('Seed data created successfully:');
  console.log(`- ${rescues.length} rescues created`);
  console.log(`- ${pets.length} pets created`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 