import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/user.model.js';
import Tour from './src/models/tour.model.js';
import connectDB from './src/config/database.config.js';

dotenv.config();

const seedData = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();
    console.log('Connected to database');

    // Drop collections to clear all data including indexes
    console.log('Clearing existing data...');
    try {
      await User.collection.drop();
      await Tour.collection.drop();
    } catch (err) {
      if (err.code !== 26) { // 26 = namespace not found
        console.warn('Warning dropping collections:', err.message);
      }
    }

    // Create guides
    console.log('Creating guides...');
    const guides = await User.create([
      {
        firstName: 'Ahmed',
        lastName: 'Hassan',
        age: 35,
        phone: '201012345678',
        country: 'Egypt',
        city: 'Cairo',
        email: 'ahmed.guide@gmail.com',
        password: 'Guide@!123456',
        role: 'guide',
        loginMethod: 'local',
        isEmailVerified: true,
      },
      {
        firstName: 'Fatima',
        lastName: 'Mohamed',
        age: 28,
        phone: '201112345679',
        country: 'Egypt',
        city: 'Giza',
        email: 'fatima.guide@gmail.com',
        password: 'Guide@!123456',
        role: 'guide',
        loginMethod: 'local',
        isEmailVerified: true,
      },
      {
        firstName: 'Mohamed',
        lastName: 'Ali',
        age: 42,
        phone: '201212345680',
        country: 'Egypt',
        city: 'Luxor',
        email: 'mohamed.guide@gmail.com',
        password: 'Guide@!123456',
        role: 'guide',
        loginMethod: 'local',
        isEmailVerified: true,
      },
      {
        firstName: 'Noor',
        lastName: 'Ibrahim',
        age: 26,
        phone: '201312345681',
        country: 'Egypt',
        city: 'Alexandria',
        email: 'noor.guide@gmail.com',
        password: 'Guide@!123456',
        role: 'guide',
        loginMethod: 'local',
        isEmailVerified: true,
      },
    ]);
    console.log(`✓ Created ${guides.length} guides`);

    // Create regular users
    console.log('Creating users...');
    const users = await User.create([
      {
        firstName: 'John',
        lastName: 'Doe',
        age: 30,
        phone: '201412345682',
        country: 'United States',
        city: 'New York',
        email: 'john.doe@gmail.com',
        password: 'User@!123456',
        role: 'user',
        loginMethod: 'local',
        isEmailVerified: true,
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        age: 27,
        phone: '201512345683',
        country: 'United Kingdom',
        city: 'London',
        email: 'jane.smith@gmail.com',
        password: 'User@!123456',
        role: 'user',
        loginMethod: 'local',
        isEmailVerified: true,
      },
      {
        firstName: 'Michael',
        lastName: 'Johnson',
        age: 35,
        phone: '201612345684',
        country: 'Canada',
        city: 'Toronto',
        email: 'michael.johnson@gmail.com',
        password: 'User@!123456',
        role: 'user',
        loginMethod: 'local',
        isEmailVerified: true,
      },
      {
        firstName: 'Sarah',
        lastName: 'Williams',
        age: 29,
        phone: '201712345685',
        country: 'Australia',
        city: 'Sydney',
        email: 'sarah.williams@gmail.com',
        password: 'User@!123456',
        role: 'user',
        loginMethod: 'local',
        isEmailVerified: true,
      },
      {
        firstName: 'David',
        lastName: 'Brown',
        age: 33,
        phone: '201812345686',
        country: 'Germany',
        city: 'Berlin',
        email: 'david.brown@gmail.com',
        password: 'User@!123456',
        role: 'user',
        loginMethod: 'local',
        isEmailVerified: true,
      },
    ]);
    console.log(`✓ Created ${users.length} users`);

    // Create tours
    console.log('Creating tours...');
    const tours = await Tour.create([
      {
        name: 'Giza Pyramids Tour',
        guide: guides[0]._id,
        price: 1500,
        currency: 'EGP',
        description: 'Explore the magnificent Giza Pyramids with our expert guide',
        city: 'Giza',
        duration: 8,
        maxGroupSize: 15,
        ratingsAverage: 4.8,
        ratingsQuantity: 156,
      },
      {
        name: 'Cairo Museum Experience',
        guide: guides[1]._id,
        price: 1200,
        currency: 'EGP',
        description: 'Discover ancient Egypt at the world-famous Cairo Museum',
        city: 'Cairo',
        duration: 6,
        maxGroupSize: 12,
        ratingsAverage: 4.6,
        ratingsQuantity: 98,
      },
      {
        name: 'Luxor Ancient Temples',
        guide: guides[2]._id,
        price: 2500,
        currency: 'EGP',
        description: 'Visit the ancient temples and tombs of Luxor',
        city: 'Luxor',
        duration: 10,
        maxGroupSize: 20,
        ratingsAverage: 4.9,
        ratingsQuantity: 234,
      },
      {
        name: 'Alexandria Coastal Tour',
        guide: guides[3]._id,
        price: 1800,
        currency: 'EGP',
        description: 'Explore the Mediterranean coast and historical sites',
        city: 'Alexandria',
        duration: 7,
        maxGroupSize: 18,
        ratingsAverage: 4.5,
        ratingsQuantity: 145,
      },
      {
        name: 'Nile River Cruise',
        guide: guides[0]._id,
        price: 2000,
        currency: 'EGP',
        description: 'Relax on a luxury cruise down the Nile River',
        city: 'Cairo',
        duration: 12,
        maxGroupSize: 50,
        ratingsAverage: 4.7,
        ratingsQuantity: 312,
      },
      {
        name: 'Sinai Mountain Adventure',
        guide: guides[1]._id,
        price: 1600,
        currency: 'EGP',
        description: 'Climb Mount Sinai and witness the sunrise',
        city: 'Sharm El-Sheikh',
        duration: 9,
        maxGroupSize: 16,
        ratingsAverage: 4.4,
        ratingsQuantity: 87,
      },
      {
        name: 'Khan El-Khalili Bazaar',
        guide: guides[2]._id,
        price: 900,
        currency: 'EGP',
        description: 'Experience traditional Egyptian markets and culture',
        city: 'Cairo',
        duration: 4,
        maxGroupSize: 20,
        ratingsAverage: 4.3,
        ratingsQuantity: 203,
      },
      {
        name: 'Valley of the Kings',
        guide: guides[3]._id,
        price: 2200,
        currency: 'EGP',
        description: 'Explore the royal tombs of ancient Egypt',
        city: 'Luxor',
        duration: 8,
        maxGroupSize: 14,
        ratingsAverage: 4.8,
        ratingsQuantity: 267,
      },
    ]);
    console.log(`✓ Created ${tours.length} tours`);

    console.log('\n✅ Seed data created successfully!');
    console.log('\nYou can now login with:');
    console.log('Admin Email: admin.user@gmail.com');
    console.log('Admin Password: ADmin@!123456');
    console.log('\nOr create new accounts during registration\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
