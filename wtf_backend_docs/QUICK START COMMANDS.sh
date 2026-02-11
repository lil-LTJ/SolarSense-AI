# 1. Install dependencies
npm install express helmet express-validator express-rate-limit prisma @prisma/client crypto

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your values

# 3. Generate Prisma client
npx prisma generate

# 4. Run database migrations
npx prisma migrate dev

# 5. Start the server
npm start

# 6. Test security endpoints
curl https://localhost:3000/health
curl -X POST https://localhost:3000/api/v1/assessments \
  -H "Content-Type: application/json" \
  -d '{"businessType":"butchery","city":"Lagos"}'