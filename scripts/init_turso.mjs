// 通过 Turso HTTP API 初始化云端数据库表结构
const DB_URL = "https://finance-tracker-sliortega295-ops.aws-ap-northeast-1.turso.io";
const TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzI0NjM5NjAsImlkIjoiMDE5Y2FmMTMtMzAwMS03ZDYwLWEzMWEtYzk4OTY2MGM4MTIzIiwicmlkIjoiMjdhOTg4MWYtOGE1My00NTM4LWJlNTMtMTQ0Y2VmNzU5MTA4In0.xcQA9N5Tn5YKHJ8ODrKtFDX0QufxzHa0LCqmIFJTVgzsw5mWJkMVkwzgekVYdMXXRQP2EHsUpfvha-Wdv_TND";

const SQL_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "icon" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "type" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Budget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Budget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Budget_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Category_userId_name_type_key" ON "Category"("userId", "name", "type")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Budget_userId_categoryId_month_year_key" ON "Budget"("userId", "categoryId", "month", "year")`,
  // Prisma 迁移记录表（让 prisma migrate status 可以识别）
  `CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "checksum" TEXT NOT NULL,
    "finished_at" DATETIME,
    "migration_name" TEXT NOT NULL,
    "logs" TEXT,
    "rolled_back_at" DATETIME,
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0
  )`,
];

async function executeSQL(sql) {
  const resp = await fetch(`${DB_URL}/v2/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests: [
        { type: "execute", stmt: { sql } },
        { type: "close" },
      ],
    }),
  });
  const data = await resp.json();
  if (data.results?.[0]?.type === "error") {
    throw new Error(data.results[0].error.message);
  }
  return data;
}

console.log("🚀 开始初始化 Turso 数据库...\n");

let success = 0;
for (const sql of SQL_STATEMENTS) {
  const preview = sql.trim().split("\n")[0].substring(0, 60);
  try {
    await executeSQL(sql);
    console.log(`✅ ${preview}`);
    success++;
  } catch (e) {
    console.log(`⚠️  ${preview}`);
    console.log(`   错误: ${e.message}`);
  }
}

console.log(`\n✅ 完成！成功执行 ${success}/${SQL_STATEMENTS.length} 条语句`);
console.log("🎉 Turso 数据库已就绪，可以部署到 Vercel！");
