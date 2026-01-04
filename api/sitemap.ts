import { SitemapStream, streamToPromise } from 'sitemap';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  try {
    const smStream = new SitemapStream({ hostname: 'https://codevo.co.in' });

    // 1. Initialize Supabase
    // Uses the same environment variables you already set up for your frontend in Vercel
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
        console.error("Missing Supabase Env vars");
        // If vars are missing, we just return the basic static sitemap
    }
    const supabase = createClient(supabaseUrl || '', supabaseKey || '');

    // 2. Add Static Pages (From your routes.tsx)
    const staticPages = [
      { url: '/', changefreq: 'daily', priority: 1.0 },
      { url: '/about', changefreq: 'monthly', priority: 0.7 },
      { url: '/events', changefreq: 'daily', priority: 0.9 },
      { url: '/practice-arena', changefreq: 'weekly', priority: 0.9 },
      { url: '/leaderboard', changefreq: 'hourly', priority: 0.8 },
      { url: '/compiler', changefreq: 'monthly', priority: 0.6 },
      { url: '/docs', changefreq: 'monthly', priority: 0.5 },
      { url: '/degree', changefreq: 'weekly', priority: 0.8 },
      { url: '/terms', changefreq: 'yearly', priority: 0.3 },
      { url: '/privacy', changefreq: 'yearly', priority: 0.3 },
    ];

    staticPages.forEach(page => smStream.write(page));

    // 3. Add Dynamic Events
    if (supabaseUrl) {
        const { data: events } = await supabase
        .from('events')
        .select('slug, updated_at')
        .eq('is_public', true);

        if (events) {
        events.forEach(event => {
            smStream.write({
            url: `/events/${event.slug}`,
            lastmod: event.updated_at,
            changefreq: 'weekly',
            priority: 0.8
            });
        });
        }

        // 4. Add Dynamic User Profiles
        const { data: profiles } = await supabase
        .from('profiles')
        .select('username');

        if (profiles) {
        profiles.forEach(user => {
            if (user.username) {
            smStream.write({
                url: `/u/${user.username}`,
                changefreq: 'weekly',
                priority: 0.6
            });
            }
        });
        }

        // 5. Add Practice Problems
        const { data: problems } = await supabase
        .from('questions') 
        .select('slug');

        if (problems) {
        problems.forEach(prob => {
            smStream.write({
            url: `/practice-arena/${prob.slug}`,
            changefreq: 'monthly',
            priority: 0.7
            });
        });
        }
    }

    // 6. Finish and Send
    smStream.end();
    const sitemapOutput = await streamToPromise(smStream);

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
    res.write(sitemapOutput.toString());
    res.end();

  } catch (e) {
    console.error(e);
    res.statusCode = 500;
    res.end();
  }
}
