import pkg from 'pg';
const { Client } = pkg;

async function resetDatabase() {
    const adminClient = new Client({
        host: 'localhost',
        port: 5433,
        user: 'postgres',
        password: 'password',
        database: 'postgres',
    });

    try {
        await adminClient.connect();
        console.log('Connected to PostgreSQL');

        // Terminate existing connections
        await adminClient.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = 'school_assessment'
        AND pid <> pg_backend_pid();
    `);
        console.log('Terminated existing connections');

        // Drop database
        await adminClient.query('DROP DATABASE IF EXISTS school_assessment;');
        console.log('Dropped database');

        // Create database
        await adminClient.query('CREATE DATABASE school_assessment;');
        console.log('Created database');

        await adminClient.end();
        console.log('✅ Database reset complete!');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

resetDatabase();
