#!/bin/bash
# 通过 Turso HTTP API 初始化云端数据库表结构

DB_URL="https://finance-tracker-sliortega295-ops.aws-ap-northeast-1.turso.io"
TOKEN="eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzI0ODY5NzUsImlkIjoiMDE5Y2FmMTMtMzAwMS03ZDYwLWEzMWEtYzk4OTY2MGM4MTIzIiwicmlkIjoiMjdhOTg4MWYtOGE1My00NTM4LWJlNTMtMTQ0Y2VmNzU5MTA4In0.73NAULtzgVLfGzo90LqBY3aSkVYDZYk30_Pj1a_qEiU9c87io3KJxOr2B4oIpxcilzTDpwkDDWiSmpZXVOCpDw"
PROXY="http://127.0.0.1:7897"

execute_sql() {
  local sql="$1"
  local preview="${sql:0:60}"
  # Escape for JSON
  local json_sql=$(echo "$sql" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read().strip()))")
  
  local body="{\"requests\":[{\"type\":\"execute\",\"stmt\":{\"sql\":$json_sql}},{\"type\":\"close\"}]}"
  
  local result=$(curl -s --proxy "$PROXY" --max-time 15 \
    -X POST \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$body" \
    "$DB_URL/v2/pipeline" 2>&1)
  
  if echo "$result" | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if d.get('results',[{}])[0].get('type') != 'error' else 1)" 2>/dev/null; then
    echo "✅ $preview..."
    return 0
  else
    local err=$(echo "$result" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('results',[{}])[0].get('error',{}).get('message','未知错误'))" 2>/dev/null || echo "$result")
    echo "⚠️  $preview..."
    echo "   错误: $err"
    return 1
  fi
}

echo "🚀 开始初始化 Turso 数据库..."
echo ""

SUCCESS=0
TOTAL=0

# 1. User 表
TOTAL=$((TOTAL+1))
execute_sql 'CREATE TABLE IF NOT EXISTS "User" ("id" TEXT NOT NULL PRIMARY KEY, "email" TEXT NOT NULL, "password" TEXT, "name" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL)' && SUCCESS=$((SUCCESS+1))

# 2. Category 表
TOTAL=$((TOTAL+1))
execute_sql 'CREATE TABLE IF NOT EXISTS "Category" ("id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "name" TEXT NOT NULL, "type" TEXT NOT NULL, "icon" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, CONSTRAINT "Category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE)' && SUCCESS=$((SUCCESS+1))

# 3. Transaction 表
TOTAL=$((TOTAL+1))
execute_sql 'CREATE TABLE IF NOT EXISTS "Transaction" ("id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "categoryId" TEXT NOT NULL, "amount" REAL NOT NULL, "type" TEXT NOT NULL, "date" DATETIME NOT NULL, "description" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE)' && SUCCESS=$((SUCCESS+1))

# 4. Budget 表
TOTAL=$((TOTAL+1))
execute_sql 'CREATE TABLE IF NOT EXISTS "Budget" ("id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "categoryId" TEXT NOT NULL, "amount" REAL NOT NULL, "month" INTEGER NOT NULL, "year" INTEGER NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, CONSTRAINT "Budget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "Budget_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE)' && SUCCESS=$((SUCCESS+1))

# 5. User 邮箱唯一索引
TOTAL=$((TOTAL+1))
execute_sql 'CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")' && SUCCESS=$((SUCCESS+1))

# 6. Category 唯一索引
TOTAL=$((TOTAL+1))
execute_sql 'CREATE UNIQUE INDEX IF NOT EXISTS "Category_userId_name_type_key" ON "Category"("userId", "name", "type")' && SUCCESS=$((SUCCESS+1))

# 7. Budget 唯一索引
TOTAL=$((TOTAL+1))
execute_sql 'CREATE UNIQUE INDEX IF NOT EXISTS "Budget_userId_categoryId_month_year_key" ON "Budget"("userId", "categoryId", "month", "year")' && SUCCESS=$((SUCCESS+1))

echo ""
echo "完成！成功执行 $SUCCESS/$TOTAL 条语句"

if [ "$SUCCESS" -eq "$TOTAL" ]; then
  echo "🎉 Turso 数据库已就绪！"
else
  echo "⚠️  部分语句失败，请检查错误信息"
fi
