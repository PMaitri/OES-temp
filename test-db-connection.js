import { Pool } from '@neondatabase/serverless';
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';

neonConfig.webSocketConstructor = ws;

const testConnection = async (password) => {
    const connectionString = `postgresql://postgres:${password}@localhost:5433/postgres`;
    console.log(`\nTesting connection with password: ${password}`);

    const pool = new Pool({ connectionString });

    try {
        const result = await pool.query('SELECT version()');
        console.log('✅ Connection successful!');
        console.log('PostgreSQL version:', result.rows[0].version);
        await pool.end();
        return true;
    } catch (error) {
        console.log('❌ Connection failed:', error.message);
        await pool.end();
        return false;
    }
};

// Test common passwords
const commonPasswords = ['postgres', 'password', 'admin', 'root', ''];

console.log('Testing PostgreSQL connection...\n');

for (const pwd of commonPasswords) {
    const success = await testConnection(pwd);
    if (success) {
        console.log(`\n🎉 Found working password: "${pwd}"`);
        console.log(`\nUpdate your .env file with:`);
        console.log(`DATABASE_URL=postgresql://postgres:${pwd}@localhost:5433/school_assessment`);
        process.exit(0);
    }
}

console.log('\n❌ None of the common passwords worked.');
console.log('Please check your PostgreSQL installation or reset your password.');
process.exit(1);
