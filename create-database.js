import pg from 'pg';
const { Client } = pg;

async function createDatabase() {
    // Connect to postgres database (default database)
    const client = new Client({
        host: 'localhost',
        port: 5433,
        user: 'postgres',
        password: 'password',
        database: 'postgres', // Connect to default postgres database
    });

    try {
        await client.connect();
        console.log('Connected to PostgreSQL server');

        // Check if database exists
        const checkDb = await client.query(
            "SELECT 1 FROM pg_database WHERE datname = 'school_assessment'"
        );

        if (checkDb.rows.length > 0) {
            console.log('✅ Database "school_assessment" already exists');
        } else {
            // Create the database
            await client.query('CREATE DATABASE school_assessment');
            console.log('✅ Database "school_assessment" created successfully');
        }

        await client.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        await client.end();
        process.exit(1);
    }
}

createDatabase();
