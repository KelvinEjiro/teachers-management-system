const { Ratelimit } = require('@upstash/ratelimit');
const { Redis } = require('@upstash/redis');

// Rate limiting is optional: without Upstash credentials the API simply runs unthrottled (fine for local dev).
let ratelimit = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  ratelimit = new Ratelimit({
    redis: new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    }),
    limiter: Ratelimit.slidingWindow(100, '60 s'),
    prefix: 'tms',
  });
}

module.exports = ratelimit;
