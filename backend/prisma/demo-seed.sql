-- SkillShift demo data. Safe to rerun: all rows use deterministic IDs and upserts.
-- Demo password for every account: Demo1234!
-- Images are hotlinked Unsplash demos (Unsplash License); real uploads live in S3.

ALTER TABLE "User" ALTER COLUMN "updatedAt" SET DEFAULT now();
ALTER TABLE "Profile" ALTER COLUMN "updatedAt" SET DEFAULT now();
ALTER TABLE "Wallet" ALTER COLUMN "updatedAt" SET DEFAULT now();
ALTER TABLE "Service" ALTER COLUMN "updatedAt" SET DEFAULT now();
ALTER TABLE "Order" ALTER COLUMN "updatedAt" SET DEFAULT now();

INSERT INTO "User" (id, email, "passwordHash", role, "isEmailVerified", "updatedAt") VALUES
  ('00000000-0000-4000-8000-000000000001', 'client.one@skillshift.demo', '$2b$10$O5YiAncLBt9waOxaUsX9fertdAOsiZGqD36fukQSJpD9KdxEyiSYe', 'CLIENT', true, now()),
  ('00000000-0000-4000-8000-000000000002', 'client.two@skillshift.demo', '$2b$10$O5YiAncLBt9waOxaUsX9fertdAOsiZGqD36fukQSJpD9KdxEyiSYe', 'CLIENT', true, now()),
  ('00000000-0000-4000-8000-000000000011', 'maya@skillshift.demo', '$2b$10$O5YiAncLBt9waOxaUsX9fertdAOsiZGqD36fukQSJpD9KdxEyiSYe', 'FREELANCER', true, now()),
  ('00000000-0000-4000-8000-000000000012', 'noah@skillshift.demo', '$2b$10$O5YiAncLBt9waOxaUsX9fertdAOsiZGqD36fukQSJpD9KdxEyiSYe', 'FREELANCER', true, now()),
  ('00000000-0000-4000-8000-000000000013', 'zara@skillshift.demo', '$2b$10$O5YiAncLBt9waOxaUsX9fertdAOsiZGqD36fukQSJpD9KdxEyiSYe', 'FREELANCER', true, now()),
  ('00000000-0000-4000-8000-000000000014', 'leo@skillshift.demo', '$2b$10$O5YiAncLBt9waOxaUsX9fertdAOsiZGqD36fukQSJpD9KdxEyiSYe', 'FREELANCER', true, now()),
  ('00000000-0000-4000-8000-000000000099', 'admin@skillshift.demo', '$2b$10$O5YiAncLBt9waOxaUsX9fertdAOsiZGqD36fukQSJpD9KdxEyiSYe', 'ADMIN', true, now()),
  ('00000000-0000-4000-8000-000000000015', 'tara@skillshift.demo', '$2b$10$O5YiAncLBt9waOxaUsX9fertdAOsiZGqD36fukQSJpD9KdxEyiSYe', 'FREELANCER', true, now()),
  ('00000000-0000-4000-8000-000000000016', 'kabir@skillshift.demo', '$2b$10$O5YiAncLBt9waOxaUsX9fertdAOsiZGqD36fukQSJpD9KdxEyiSYe', 'FREELANCER', true, now()),
  ('00000000-0000-4000-8000-000000000017', 'ananya@skillshift.demo', '$2b$10$O5YiAncLBt9waOxaUsX9fertdAOsiZGqD36fukQSJpD9KdxEyiSYe', 'FREELANCER', true, now()),
  ('00000000-0000-4000-8000-000000000018', 'dev@skillshift.demo', '$2b$10$O5YiAncLBt9waOxaUsX9fertdAOsiZGqD36fukQSJpD9KdxEyiSYe', 'FREELANCER', true, now())
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = EXCLUDED.role, "isEmailVerified" = true;

INSERT INTO "Profile" (id, "userId", "displayName", bio, "avatarUrl", skills, "portfolioUrls", rating, "totalReviews") VALUES
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'Aarav Client', 'Product builder looking for thoughtful collaborators.', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&crop=faces&w=400&h=400&q=80', ARRAY['product','startups'], ARRAY[]::text[], 0, 0),
  ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002', 'Diya Client', 'Independent founder with a growing studio.', 'https://images.unsplash.com/photo-1627161683077-e34782c24d81?auto=format&fit=crop&crop=faces&w=400&h=400&q=80', ARRAY['branding','content'], ARRAY[]::text[], 0, 0),
  ('10000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000011', 'Maya Rao', 'Brand designer turning complex ideas into clear visual systems.', 'https://images.unsplash.com/photo-1765005204058-10418f5123c5?auto=format&fit=crop&crop=faces&w=400&h=400&q=80', ARRAY['branding','figma','illustration'], ARRAY['portfolios/00000000-0000-4000-8000-000000000011/maya-branding']::text[], 4.8, 12),
  ('10000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000012', 'Noah Shah', 'Full-stack developer focused on fast, dependable product launches.', 'https://images.unsplash.com/photo-1724128195247-ab10e4535b53?auto=format&fit=crop&crop=faces&w=400&h=400&q=80', ARRAY['react','nextjs','typescript'], ARRAY['portfolios/00000000-0000-4000-8000-000000000012/noah-products']::text[], 4.9, 18),
  ('10000000-0000-4000-8000-000000000013', '00000000-0000-4000-8000-000000000013', 'Zara Mehta', 'Copywriter and content strategist for ambitious teams.', 'https://images.unsplash.com/photo-1611432579699-484f7990b127?auto=format&fit=crop&crop=faces&w=400&h=400&q=80', ARRAY['copywriting','seo','content'], ARRAY['portfolios/00000000-0000-4000-8000-000000000013/zara-copy']::text[], 4.7, 9),
  ('10000000-0000-4000-8000-000000000014', '00000000-0000-4000-8000-000000000014', 'Leo Fernandes', 'Motion designer making product stories feel alive.', 'https://images.unsplash.com/photo-1656399910161-8efafd973a29?auto=format&fit=crop&crop=faces&w=400&h=400&q=80', ARRAY['motion','video','after-effects'], ARRAY['portfolios/00000000-0000-4000-8000-000000000014/leo-motion']::text[], 4.6, 7),
  ('10000000-0000-4000-8000-000000000099', '00000000-0000-4000-8000-000000000099', 'SkillShift Admin', 'Marketplace operations.', NULL, ARRAY['operations'], ARRAY[]::text[], 0, 0),
  ('10000000-0000-4000-8000-000000000015', '00000000-0000-4000-8000-000000000015', 'Tara Singh', 'Shopify and Webflow specialist helping small brands launch storefronts that sell.', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&crop=faces&w=400&h=400&q=80', ARRAY['shopify','webflow','ecommerce'], ARRAY['portfolios/00000000-0000-4000-8000-000000000015/tara-stores']::text[], 4.9, 21),
  ('10000000-0000-4000-8000-000000000016', '00000000-0000-4000-8000-000000000016', 'Kabir Malhotra', 'Podcast and short-form video editor with a creator-first workflow.', 'https://images.unsplash.com/photo-1718209881006-f6e313e2e109?auto=format&fit=crop&crop=faces&w=400&h=400&q=80', ARRAY['podcast','video-editing','photo-retouching'], ARRAY['portfolios/00000000-0000-4000-8000-000000000016/kabir-podcasts']::text[], 4.8, 16),
  ('10000000-0000-4000-8000-000000000017', '00000000-0000-4000-8000-000000000017', 'Ananya Menon', 'Lifecycle marketer writing email and social playbooks that compound.', 'https://images.unsplash.com/photo-1765005204227-bf58bcdd4449?auto=format&fit=crop&crop=faces&w=400&h=400&q=80', ARRAY['email-marketing','social-media','growth'], ARRAY['portfolios/00000000-0000-4000-8000-000000000017/ananya-launches']::text[], 4.9, 14),
  ('10000000-0000-4000-8000-000000000018', '00000000-0000-4000-8000-000000000018', 'Dev Patel', 'Backend engineer building Supabase foundations and decision-ready dashboards.', 'https://images.unsplash.com/photo-1598411435746-47bfecc3ea98?auto=format&fit=crop&crop=faces&w=400&h=400&q=80', ARRAY['supabase','postgres','analytics'], ARRAY['portfolios/00000000-0000-4000-8000-000000000018/dev-platforms']::text[], 4.8, 11)
ON CONFLICT ("userId") DO UPDATE SET "displayName" = EXCLUDED."displayName", bio = EXCLUDED.bio, "avatarUrl" = EXCLUDED."avatarUrl", skills = EXCLUDED.skills, rating = EXCLUDED.rating, "totalReviews" = EXCLUDED."totalReviews";

INSERT INTO "Wallet" (id, "userId", balance) VALUES
  ('20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 12500300),
  ('20000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002', 10800400),
  ('20000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000011', 9450000),
  ('20000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000012', 27500000),
  ('20000000-0000-4000-8000-000000000013', '00000000-0000-4000-8000-000000000013', 12500000),
  ('20000000-0000-4000-8000-000000000014', '00000000-0000-4000-8000-000000000014', 9800000),
  ('20000000-0000-4000-8000-000000000099', '00000000-0000-4000-8000-000000000099', 0),
  ('20000000-0000-4000-8000-000000000015', '00000000-0000-4000-8000-000000000015', 18500000),
  ('20000000-0000-4000-8000-000000000016', '00000000-0000-4000-8000-000000000016', 8250000),
  ('20000000-0000-4000-8000-000000000017', '00000000-0000-4000-8000-000000000017', 10450000),
  ('20000000-0000-4000-8000-000000000018', '00000000-0000-4000-8000-000000000018', 16700000)
ON CONFLICT ("userId") DO UPDATE SET balance = EXCLUDED.balance;

INSERT INTO "Service" (id, "freelancerId", title, description, price, "deliveryDays", skills, "imageUrls", status) VALUES
  ('30000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000011', 'Brand identity starter kit', 'A focused logo, colour palette, typography pair, and handoff guide for a new product.', 2999900, 7, ARRAY['branding','figma','logo'], ARRAY[
    'https://images.unsplash.com/photo-1627384113710-424c9181ebbb?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1718670014130-ee9ee053598d?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1777652918753-d66882b15391?auto=format&fit=crop&w=1600&h=1000&q=80'
  ]::text[], 'ACTIVE'),
  ('30000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000012', 'Next.js product landing page', 'A responsive, accessible landing page built with Next.js and a clean content structure.', 4499900, 10, ARRAY['react','nextjs','typescript'], ARRAY[
    'https://images.unsplash.com/photo-1775441031103-1d559a6f91cd?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1519222970733-f546218fa6d7?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1707836916010-3c4ad261936c?auto=format&fit=crop&w=1600&h=1000&q=80'
  ]::text[], 'ACTIVE'),
  ('30000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000013', 'Website copy that converts', 'Homepage and product messaging rewritten around one clear customer promise.', 1499900, 5, ARRAY['copywriting','content','seo'], ARRAY[
    'https://images.unsplash.com/photo-1504691342899-4d92b50853e1?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1550592704-6c76defa9985?auto=format&fit=crop&w=1600&h=1000&q=80'
  ]::text[], 'ACTIVE'),
  ('30000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000014', 'Product launch motion pack', 'Three short motion assets for a launch page, social post, or product demo.', 3299900, 8, ARRAY['motion','video','after-effects'], ARRAY[
    'https://images.unsplash.com/photo-1617791160505-6f00504e3519?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1650943574955-ac02c65cfc71?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1622737133809-d95047b9e673?auto=format&fit=crop&w=1600&h=1000&q=80'
  ]::text[], 'ACTIVE'),
  ('30000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000011', 'Figma mobile app screens', 'A polished six-screen mobile flow with components and developer-ready specs.', 3999900, 9, ARRAY['figma','ui','mobile'], ARRAY[
    'https://images.unsplash.com/photo-1767449280971-46e438b1ce4a?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1762341119237-98df67c9c3c9?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1618788372246-79faff0c3742?auto=format&fit=crop&w=1600&h=1000&q=80'
  ]::text[], 'ACTIVE'),
  ('30000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000012', 'API integration sprint', 'Connect a frontend to a REST API with loading, error, and empty states.', 5999900, 12, ARRAY['react','node','api'], ARRAY[
    'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1605379399642-870262d3d051?auto=format&fit=crop&w=1600&h=1000&q=80'
  ]::text[], 'ACTIVE'),
  ('30000000-0000-4000-8000-000000000007', '00000000-0000-4000-8000-000000000013', 'SEO content plan', 'A practical 30-day content plan with search intent, briefs, and publishing priorities.', 1199900, 4, ARRAY['seo','content','research'], ARRAY[
    'https://images.unsplash.com/photo-1763038311036-6d18805537e5?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1783115259399-3a5a3e0e4592?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1666875753105-c63a6f3bdc86?auto=format&fit=crop&w=1600&h=1000&q=80'
  ]::text[], 'ACTIVE'),
  ('30000000-0000-4000-8000-000000000008', '00000000-0000-4000-8000-000000000014', 'Explainer video edit', 'A concise product explainer edit with captions, pacing, and delivery-ready exports.', 2499900, 10, ARRAY['video','editing','motion'], ARRAY[
    'https://images.unsplash.com/photo-1779896412277-c4fd15c7a89c?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1609619385002-f40f1df9b7eb?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1600&h=1000&q=80'
  ]::text[], 'ACTIVE'),
  ('30000000-0000-4000-8000-000000000009', '00000000-0000-4000-8000-000000000011', 'Design system audit', 'A practical audit of tokens, components, and interaction consistency.', 1299900, 6, ARRAY['design-system','figma','ux'], ARRAY[
    'https://images.unsplash.com/photo-1680016661694-1cd3faf31c3a?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1573867639040-6dd25fa5f597?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1561406059-0229136fe606?auto=format&fit=crop&w=1600&h=1000&q=80'
  ]::text[], 'PENDING_REVIEW'),
  ('30000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000012', 'React performance review', 'A focused review of rendering, data loading, and bundle opportunities.', 2199900, 5, ARRAY['react','performance','typescript'], ARRAY[
    'https://images.unsplash.com/photo-1587620962725-abab7fe55159?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1765445665883-085301570c87?auto=format&fit=crop&w=1600&h=1000&q=80'
  ]::text[], 'PAUSED'),
  ('30000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000013', 'Founder story article', 'A warm, edited founder story for a launch, press page, or investor update.', 999900, 6, ARRAY['writing','editing','storytelling'], ARRAY[
    'https://images.unsplash.com/photo-1769167693699-ff3e3b91abb5?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1555601568-c9e6f328489b?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1530819568329-97653eafbbfa?auto=format&fit=crop&w=1600&h=1000&q=80'
  ]::text[], 'ACTIVE'),
  ('30000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000014', 'Social launch templates', 'A reusable set of launch graphics and motion-ready social templates.', 1599900, 7, ARRAY['design','social','motion'], ARRAY[
    'https://images.unsplash.com/photo-1787834564757-ecbf58d80138?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1724862936518-ae7fcfc052c1?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=1600&h=1000&q=80'
  ]::text[], 'REJECTED'),
  ('30000000-0000-4000-8000-000000000013', '00000000-0000-4000-8000-000000000012', 'Product analytics dashboard build', 'A production-ready dashboard that turns raw product data into clear, decision-ready views.', 4999900, 14, ARRAY['react','dashboards','data'], ARRAY[
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?auto=format&fit=crop&w=1600&h=1000&q=80'
  ]::text[], 'ACTIVE'),
  ('30000000-0000-4000-8000-000000000014', '00000000-0000-4000-8000-000000000011', 'Pitch deck design and storytelling', 'A persuasive investor or sales deck: narrative, slide design, and speaker notes.', 1799900, 8, ARRAY['presentation','figma','storytelling'], ARRAY[
    'https://images.unsplash.com/photo-1758691736545-5c33b6255dca?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1758691736407-02406d18df6c?auto=format&fit=crop&w=1600&h=1000&q=80'
  ]::text[], 'ACTIVE'),
  ('30000000-0000-4000-8000-000000000015', '00000000-0000-4000-8000-000000000013', 'Landing page microcopy that guides', 'Buttons, empty states, and onboarding text rewritten so users always know the next step.', 799900, 5, ARRAY['ux-writing','microcopy','copywriting'], ARRAY[
    'https://images.unsplash.com/photo-1775440285627-ce48346bc58c?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1558478551-1a378f63328e?auto=format&fit=crop&w=1600&h=1000&q=80'
  ]::text[], 'ACTIVE'),
  ('30000000-0000-4000-8000-000000000016', '00000000-0000-4000-8000-000000000015', 'Shopify store setup', 'A complete Shopify store from your brand kit: theme setup, products, payments, and launch checks.', 3499900, 10, ARRAY['shopify','ecommerce','store-setup'], ARRAY[
    'https://images.unsplash.com/photo-1658297063569-162817482fb6?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1487014679447-9f8336841d58?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1763872038252-e6c4e0a11067?auto=format&fit=crop&w=1600&h=1000&q=80'
  ]::text[], 'ACTIVE'),
  ('30000000-0000-4000-8000-000000000017', '00000000-0000-4000-8000-000000000015', 'Webflow marketing site', 'A polished marketing site in Webflow with CMS collections, SEO basics, and editor training.', 2799900, 8, ARRAY['webflow','no-code','landing-pages'], ARRAY[
    'https://images.unsplash.com/photo-1634084462412-b54873c0a56d?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1629195968955-e1a2a92b0c5c?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1707836885254-79b6e3d7b18d?auto=format&fit=crop&w=1600&h=1000&q=80'
  ]::text[], 'ACTIVE'),
  ('30000000-0000-4000-8000-000000000018', '00000000-0000-4000-8000-000000000016', 'Podcast editing', 'Clean conversation edits with noise removal, music bed, chapters, and show notes from your raw recording.', 499900, 3, ARRAY['podcast','audio-editing','post-production'], ARRAY[
    'https://images.unsplash.com/photo-1589903308904-1010c2294adc?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1668605335684-c97ce92cbd76?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=1600&h=1000&q=80'
  ]::text[], 'ACTIVE'),
  ('30000000-0000-4000-8000-000000000019', '00000000-0000-4000-8000-000000000016', 'Short-form video pack (8 edits)', 'Eight vertical edits cut from your long-form footage with captions, hooks, and platform-ready exports.', 1299900, 6, ARRAY['short-form','video-editing','captions'], ARRAY[
    'https://images.unsplash.com/photo-1515634928627-2a4e0dae3ddf?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1528109966604-5a6a4a964e8d?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1726409724841-016b6f4f8b1b?auto=format&fit=crop&w=1600&h=1000&q=80'
  ]::text[], 'ACTIVE'),
  ('30000000-0000-4000-8000-000000000020', '00000000-0000-4000-8000-000000000016', 'Product photo retouching (25 images)', 'Twenty-five ecommerce-ready product images with colour accuracy, dust cleanup, and consistent shadows.', 999900, 4, ARRAY['retouching','ecommerce','product-photography'], ARRAY[
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1629198688000-71f23e745b6e?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1764694187688-454d172e5ca0?auto=format&fit=crop&w=1600&h=1000&q=80'
  ]::text[], 'ACTIVE'),
  ('30000000-0000-4000-8000-000000000021', '00000000-0000-4000-8000-000000000017', 'Email welcome sequence', 'A five-email welcome sequence that introduces your product and turns new signups into first orders.', 1199900, 6, ARRAY['email-marketing','copywriting','automation'], ARRAY[
    'https://images.unsplash.com/photo-1557200134-90327ee9fafa?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?auto=format&fit=crop&w=1600&h=1000&q=80'
  ]::text[], 'ACTIVE'),
  ('30000000-0000-4000-8000-000000000022', '00000000-0000-4000-8000-000000000017', 'Social growth sprint', 'A two-week posting sprint: content calendar, twelve ready posts, and a simple metric review.', 1799900, 10, ARRAY['social-media','content','analytics'], ARRAY[
    'https://images.unsplash.com/photo-1683721003111-070bcc053d8b?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1787834565211-ef49925ffac1?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1532356884227-66d7c0e9e4c2?auto=format&fit=crop&w=1600&h=1000&q=80'
  ]::text[], 'ACTIVE'),
  ('30000000-0000-4000-8000-000000000023', '00000000-0000-4000-8000-000000000018', 'Supabase schema and row-level security', 'A production-ready Supabase schema with row-level security policies, seed data, and typed client setup.', 2499900, 7, ARRAY['supabase','postgres','security'], ARRAY[
    'https://images.unsplash.com/photo-1664854953181-b12e6dda8b7c?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1489875347897-49f64b51c1f8?auto=format&fit=crop&w=1600&h=1000&q=80'
  ]::text[], 'ACTIVE'),
  ('30000000-0000-4000-8000-000000000024', '00000000-0000-4000-8000-000000000018', 'BI dashboard build', 'A decision-ready dashboard wired to your data source with the metrics your team actually reviews.', 2999900, 9, ARRAY['bi','dashboards','data'], ARRAY[
    'https://images.unsplash.com/photo-1542744173-05336fcc7ad4?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1591696205602-2f950c417cb9?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1644088379091-d574269d422f?auto=format&fit=crop&w=1600&h=1000&q=80'
  ]::text[], 'ACTIVE'),
  ('30000000-0000-4000-8000-000000000025', '00000000-0000-4000-8000-000000000013', 'API technical documentation', 'Clear API reference and quickstart guides with worked examples, auth flows, and copy-paste snippets.', 1499900, 6, ARRAY['technical-writing','documentation','api'], ARRAY[
    'https://images.unsplash.com/photo-1517971071642-34a2d3ecc9cd?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1462642109801-4ac2971a3a51?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1778113048574-cebbad75dda6?auto=format&fit=crop&w=1600&h=1000&q=80'
  ]::text[], 'ACTIVE'),
  ('30000000-0000-4000-8000-000000000026', '00000000-0000-4000-8000-000000000014', 'Logo animation and Lottie export', 'Your logo animated for product and social, exported as Lottie and video with usage notes.', 1899900, 7, ARRAY['lottie','motion','animation'], ARRAY[
    'https://images.unsplash.com/photo-1672080070762-764c74ee1227?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1627637819794-fba32f82be16?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1671869203911-cdaab14b9811?auto=format&fit=crop&w=1600&h=1000&q=80'
  ]::text[], 'ACTIVE'),
  ('30000000-0000-4000-8000-000000000027', '00000000-0000-4000-8000-000000000011', 'WCAG 2.2 accessibility audit', 'A WCAG 2.2 audit of your key flows with prioritised fixes and a re-test after changes.', 1699900, 6, ARRAY['accessibility','wcag','audit'], ARRAY[
    'https://images.unsplash.com/photo-1581094017399-34c4fb48c65b?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1504270856906-58da8a7e7102?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1771790686518-74d9104e9433?auto=format&fit=crop&w=1600&h=1000&q=80'
  ]::text[], 'ACTIVE'),
  ('30000000-0000-4000-8000-000000000028', '00000000-0000-4000-8000-000000000012', 'Stripe billing integration', 'Subscriptions, checkout, and webhooks wired into your product with a test-mode walkthrough.', 3999900, 10, ARRAY['stripe','payments','node'], ARRAY[
    'https://images.unsplash.com/photo-1733503747506-773e56e4078f?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1768483538267-fce52de424d5?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1599050751795-6cdaafbc2319?auto=format&fit=crop&w=1600&h=1000&q=80'
  ]::text[], 'ACTIVE'),
  ('30000000-0000-4000-8000-000000000029', '00000000-0000-4000-8000-000000000012', 'React Native MVP (auth + 4 screens)', 'A React Native MVP with authentication and four core screens ready for TestFlight and Play testing.', 6499900, 14, ARRAY['react-native','mobile','expo'], ARRAY[
    'https://images.unsplash.com/photo-1640653410511-bee9946865ab?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1633250391894-397930e3f5f2?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1782328479547-d4c0bb802143?auto=format&fit=crop&w=1600&h=1000&q=80'
  ]::text[], 'ACTIVE'),
  ('30000000-0000-4000-8000-000000000030', '00000000-0000-4000-8000-000000000013', 'Resume and LinkedIn writing', 'A rewritten resume and LinkedIn profile that position you for the roles you actually want.', 599900, 4, ARRAY['resume','linkedin','career'], ARRAY[
    'https://images.unsplash.com/photo-1698047681432-006d2449c631?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1653038417332-6db0ff9d4bfb?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1758520144437-f068ecaf0d83?auto=format&fit=crop&w=1600&h=1000&q=80'
  ]::text[], 'ACTIVE')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, price = EXCLUDED.price, "deliveryDays" = EXCLUDED."deliveryDays", skills = EXCLUDED.skills, "imageUrls" = EXCLUDED."imageUrls", status = EXCLUDED.status, "deletedAt" = NULL;

INSERT INTO "Order" (id, "clientId", "freelancerId", "serviceId", status, price, "deliveryDays", requirements, "deliveryNote", "autoCompleteAt") VALUES
  ('40000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000011', '30000000-0000-4000-8000-000000000001', 'IN_PROGRESS', 2999900, 7, 'Need a calm, editorial identity for a climate analytics product.', NULL, NULL),
  ('40000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000012', '30000000-0000-4000-8000-000000000002', 'DELIVERED', 4499900, 10, 'Please use the attached product notes and keep the page fast on mobile.', 'The responsive landing page and handoff notes are ready for review.', now() + interval '5 days'),
  ('40000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000011', '30000000-0000-4000-8000-000000000005', 'COMPLETED', 3999900, 9, 'Design a simple onboarding flow for a habit app.', 'Final Figma file and component notes delivered.', NULL),
  ('40000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000013', '30000000-0000-4000-8000-000000000003', 'DISPUTED', 1499900, 5, 'Rewrite the homepage with a sharper enterprise message.', 'First draft delivered, but several requested sections are missing.', NULL),
  ('40000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000014', '30000000-0000-4000-8000-000000000004', 'CANCELLED', 3299900, 8, 'Create a product launch animation for the new release.', NULL, NULL),
  ('40000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000012', '30000000-0000-4000-8000-000000000006', 'COMPLETED', 5999900, 12, 'Connect the checkout flow to the existing API.', 'Integration shipped with error and loading states.', NULL),
  ('40000000-0000-4000-8000-000000000007', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000014', '30000000-0000-4000-8000-000000000008', 'IN_PROGRESS', 2499900, 10, 'Edit a concise explainer for our product launch.', NULL, NULL),
  ('40000000-0000-4000-8000-000000000008', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000013', '30000000-0000-4000-8000-000000000007', 'DELIVERED', 1199900, 4, 'Build a four-week SEO plan for a new marketplace.', 'The plan, keywords, and first briefs are ready.', now() + interval '6 days')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, price = EXCLUDED.price, "deliveryDays" = EXCLUDED."deliveryDays", requirements = EXCLUDED.requirements, "deliveryNote" = EXCLUDED."deliveryNote", "autoCompleteAt" = EXCLUDED."autoCompleteAt";

INSERT INTO "Escrow" (id, "orderId", amount, status, "releasedAt", "refundedAt") VALUES
  ('50000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 2999900, 'HOLDING', NULL, NULL),
  ('50000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000002', 4499900, 'HOLDING', NULL, NULL),
  ('50000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000003', 3999900, 'RELEASED', now() - interval '8 days', NULL),
  ('50000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000004', 1499900, 'HOLDING', NULL, NULL),
  ('50000000-0000-4000-8000-000000000005', '40000000-0000-4000-8000-000000000005', 3299900, 'REFUNDED', NULL, now() - interval '12 days'),
  ('50000000-0000-4000-8000-000000000006', '40000000-0000-4000-8000-000000000006', 5999900, 'RELEASED', now() - interval '20 days', NULL),
  ('50000000-0000-4000-8000-000000000007', '40000000-0000-4000-8000-000000000007', 2499900, 'HOLDING', NULL, NULL),
  ('50000000-0000-4000-8000-000000000008', '40000000-0000-4000-8000-000000000008', 1199900, 'HOLDING', NULL, NULL)
ON CONFLICT ("orderId") DO UPDATE SET amount = EXCLUDED.amount, status = EXCLUDED.status, "releasedAt" = EXCLUDED."releasedAt", "refundedAt" = EXCLUDED."refundedAt";

INSERT INTO "Transaction" (id, "walletId", type, amount, description, "orderId") VALUES
  ('60000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'DEPOSIT', 26000000, 'Initial demo wallet funding', NULL),
  ('60000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'ESCROW_HOLD', 2999900, 'Escrow hold for brand identity order', '40000000-0000-4000-8000-000000000001'),
  ('60000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001', 'ESCROW_HOLD', 4499900, 'Escrow hold for landing page order', '40000000-0000-4000-8000-000000000002'),
  ('60000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000001', 'ESCROW_REFUND', 3299900, 'Refund for cancelled motion order', '40000000-0000-4000-8000-000000000005'),
  ('60000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000002', 'DEPOSIT', 20000000, 'Initial demo wallet funding', NULL),
  ('60000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000011', 'ESCROW_RELEASE', 3999900, 'Payment received for completed order', '40000000-0000-4000-8000-000000000003'),
  ('60000000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000012', 'ESCROW_RELEASE', 5999900, 'Payment received for completed order', '40000000-0000-4000-8000-000000000006'),
  ('60000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000012', 'WITHDRAWAL', 2500000, 'Demo earnings withdrawal', NULL),
  ('60000000-0000-4000-8000-000000000009', '20000000-0000-4000-8000-000000000013', 'DEPOSIT', 10000000, 'Demo earnings balance', NULL),
  ('60000000-0000-4000-8000-000000000010', '20000000-0000-4000-8000-000000000014', 'DEPOSIT', 8000000, 'Demo earnings balance', NULL),
  ('60000000-0000-4000-8000-000000000011', '20000000-0000-4000-8000-000000000002', 'ESCROW_HOLD', 1499900, 'Escrow hold for copy order', '40000000-0000-4000-8000-000000000004'),
  ('60000000-0000-4000-8000-000000000012', '20000000-0000-4000-8000-000000000002', 'ESCROW_HOLD', 2499900, 'Escrow hold for explainer order', '40000000-0000-4000-8000-000000000007'),
  ('60000000-0000-4000-8000-000000000013', '20000000-0000-4000-8000-000000000002', 'ESCROW_HOLD', 1199900, 'Escrow hold for SEO plan order', '40000000-0000-4000-8000-000000000008'),
  ('60000000-0000-4000-8000-000000000014', '20000000-0000-4000-8000-000000000001', 'ESCROW_HOLD', 5999900, 'Escrow hold for API integration order', '40000000-0000-4000-8000-000000000006'),
  ('60000000-0000-4000-8000-000000000015', '20000000-0000-4000-8000-000000000001', 'ESCROW_HOLD', 3299900, 'Escrow hold for motion order', '40000000-0000-4000-8000-000000000005'),
  ('60000000-0000-4000-8000-000000000016', '20000000-0000-4000-8000-000000000015', 'DEPOSIT', 15000000, 'Demo earnings balance', NULL),
  ('60000000-0000-4000-8000-000000000017', '20000000-0000-4000-8000-000000000016', 'DEPOSIT', 8000000, 'Demo earnings balance', NULL),
  ('60000000-0000-4000-8000-000000000018', '20000000-0000-4000-8000-000000000017', 'DEPOSIT', 10000000, 'Demo earnings balance', NULL),
  ('60000000-0000-4000-8000-000000000019', '20000000-0000-4000-8000-000000000018', 'DEPOSIT', 12000000, 'Demo earnings balance', NULL)
ON CONFLICT (id) DO UPDATE SET "walletId" = EXCLUDED."walletId", type = EXCLUDED.type, amount = EXCLUDED.amount, description = EXCLUDED.description, "orderId" = EXCLUDED."orderId";

INSERT INTO "Review" (id, "orderId", "serviceId", "reviewerId", "revieweeId", rating, comment) VALUES
  ('70000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000011', 5, 'Thoughtful work, clear handoff, and excellent component detail.'),
  ('70000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000006', '30000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000012', 5, 'Fast implementation and great communication throughout.')
ON CONFLICT ("orderId") DO NOTHING;

INSERT INTO "Dispute" (id, "orderId", "clientId", reason, status, "adminNote") VALUES
  ('80000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000002', 'The copy delivery is missing the requested enterprise section.', 'OPEN', NULL)
ON CONFLICT ("orderId") DO UPDATE SET reason = EXCLUDED.reason, status = EXCLUDED.status, "adminNote" = EXCLUDED."adminNote";

INSERT INTO "Conversation" (id, "orderId") VALUES
  ('90000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001'),
  ('90000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000002'),
  ('90000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000004')
ON CONFLICT ("orderId") DO NOTHING;

INSERT INTO "Message" (id, "conversationId", "senderId", content) VALUES
  ('91000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'Hi Maya, I have shared the product notes and references.'),
  ('91000000-0000-4000-8000-000000000002', '90000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000011', 'Thanks Aarav. I will share the first direction tomorrow.'),
  ('91000000-0000-4000-8000-000000000003', '90000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000012', 'The responsive build is ready for your review.'),
  ('91000000-0000-4000-8000-000000000004', '90000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000002', 'Could you add the enterprise proof points to the next revision?')
ON CONFLICT (id) DO NOTHING;

INSERT INTO "Notification" (id, "userId", type, title, body, "orderId", "isRead") VALUES
  ('a0000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'ORDER_DELIVERED', 'Order delivered', 'Your Next.js landing page is ready for review.', '40000000-0000-4000-8000-000000000002', false),
  ('a0000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000011', 'ORDER_PLACED', 'New order received', 'Aarav placed a brand identity order.', '40000000-0000-4000-8000-000000000001', true),
  ('a0000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000002', 'DISPUTE_OPENED', 'New dispute opened', 'An order needs admin review.', '40000000-0000-4000-8000-000000000004', false),
  ('a0000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000012', 'PAYMENT_RECEIVED', 'Payment received', 'Payment was released for your completed order.', '40000000-0000-4000-8000-000000000006', true),
  ('a0000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000013', 'MESSAGE_RECEIVED', 'New message', 'You received a message about an order.', '40000000-0000-4000-8000-000000000004', false),
  ('a0000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000014', 'ORDER_COMPLETED', 'Order completed', 'Your completed order released payment.', '40000000-0000-4000-8000-000000000006', true)
ON CONFLICT (id) DO UPDATE SET body = EXCLUDED.body, "orderId" = EXCLUDED."orderId", "isRead" = EXCLUDED."isRead";

INSERT INTO "AuditLog" (id, "userId", "orderId", action, before, after) VALUES
  ('b0000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 'ORDER_STATUS_CHANGED', '{"status":"PENDING"}', '{"status":"IN_PROGRESS"}'),
  ('b0000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000012', '40000000-0000-4000-8000-000000000002', 'ORDER_STATUS_CHANGED', '{"status":"IN_PROGRESS"}', '{"status":"DELIVERED"}'),
  ('b0000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000004', 'DISPUTE_OPENED', '{"status":"DELIVERED"}', '{"status":"DISPUTED"}')
ON CONFLICT (id) DO NOTHING;

SELECT 'users' AS table_name, count(*) AS demo_count FROM "User" WHERE email LIKE '%@skillshift.demo'
UNION ALL SELECT 'services', count(*) FROM "Service" WHERE id LIKE '30000000-%'
UNION ALL SELECT 'orders', count(*) FROM "Order" WHERE id LIKE '40000000-%'
UNION ALL SELECT 'wallets', count(*) FROM "Wallet" WHERE id LIKE '20000000-%'
UNION ALL SELECT 'transactions', count(*) FROM "Transaction" WHERE id LIKE '60000000-%'
UNION ALL SELECT 'notifications', count(*) FROM "Notification" WHERE id LIKE 'a0000000-%';

ALTER TABLE "User" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "Profile" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "Wallet" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "Service" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "updatedAt" DROP DEFAULT;
