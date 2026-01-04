import { SitemapStream, streamToPromise } from 'sitemap';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  try {
    const smStream = new SitemapStream({ hostname: 'https://codevo.co.in' });

    // 1. Initialize Supabase
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    // Safety check - if no keys, still return a basic sitemap
    if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);

        // --- Fetch Dynamic Data ---
        
        // Events
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

        // Users
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

        // Problems
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

    // --- Add Static Pages ---
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

    // End stream
    smStream.end();

    // Generate XML
    const sitemapOutput = await streamToPromise(smStream);

    // Send Response
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
    res.status(200).send(sitemapOutput.toString());

  } catch (e) {
    console.error("Sitemap generation error:", e);
    res.status(500).send("Error generating sitemap");
  }
}
