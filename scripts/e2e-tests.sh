npm run test:db:setup && 
npx nuxt dev --dotenv .env.test > nuxt-test.log 2>&1 & 
sleep 8 && 
vitest run --project nuxt ||
pstree -A -p $$ | grep -Eow "[0-9]+" | xargs kill 2>/dev/null || true