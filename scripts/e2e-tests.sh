npm run test:db:setup && 
npm run dev -- --dotenv .env.test > nuxt-test.log 2>&1 & 
sleep 8 && 
vitest run --project nuxt ;
pkill -f "nuxt dev --dotenv .env.test"