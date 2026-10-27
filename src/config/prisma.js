
require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing. Check the .env file.");
}

const parsedUrl = new URL(databaseUrl);

const adapter = new PrismaPg({
    host: parsedUrl.hostname,
    port: Number(parsedUrl.port || 5432),
    user: decodeURIComponent(parsedUrl.username),
    password: decodeURIComponent(parsedUrl.password),
    database: parsedUrl.pathname.slice(1).split("?")[0],
    ssl: false,
});

const prisma = new PrismaClient({ adapter });

module.exports = { prisma };
