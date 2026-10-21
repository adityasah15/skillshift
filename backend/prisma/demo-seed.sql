-- SkillShift demo data. Safe to rerun: all rows use deterministic IDs and upserts.
-- Demo password for every account: Demo1234!
-- Images are hotlinked Unsplash demos (Unsplash License); real uploads live in S3.
-- Timestamps are relative to seed time so the demo always has a recent history.
-- Profile reputation and wallet balances are derived from their Review and
-- Transaction rows at the end so the demo dataset stays internally consistent.

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
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  "isEmailVerified" = true,
  "emailVerifyTokenHash" = NULL,
  "emailVerifyTokenExpiresAt" = NULL,
  "passwordResetTokenHash" = NULL,
  "passwordResetExpiresAt" = NULL,
  "deletedAt" = NULL;

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
ON CONFLICT ("userId") DO UPDATE SET
  "displayName" = EXCLUDED."displayName",
  bio = EXCLUDED.bio,
  "avatarUrl" = EXCLUDED."avatarUrl",
  skills = EXCLUDED.skills,
  "portfolioUrls" = EXCLUDED."portfolioUrls",
  rating = EXCLUDED.rating,
  "totalReviews" = EXCLUDED."totalReviews";

INSERT INTO "Wallet" (id, "userId", balance) VALUES
  ('20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 18201100),
  ('20000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002', 16601100),
  ('20000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000011', 16449600),
  ('20000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000012', 51999500),
  ('20000000-0000-4000-8000-000000000013', '00000000-0000-4000-8000-000000000013', 17099400),
  ('20000000-0000-4000-8000-000000000014', '00000000-0000-4000-8000-000000000014', 20799600),
  ('20000000-0000-4000-8000-000000000099', '00000000-0000-4000-8000-000000000099', 0),
  ('20000000-0000-4000-8000-000000000015', '00000000-0000-4000-8000-000000000015', 29099600),
  ('20000000-0000-4000-8000-000000000016', '00000000-0000-4000-8000-000000000016', 11049700),
  ('20000000-0000-4000-8000-000000000017', '00000000-0000-4000-8000-000000000017', 13449800),
  ('20000000-0000-4000-8000-000000000018', '00000000-0000-4000-8000-000000000018', 20699800)
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
ON CONFLICT (id) DO UPDATE SET "freelancerId" = EXCLUDED."freelancerId", title = EXCLUDED.title, description = EXCLUDED.description, price = EXCLUDED.price, "deliveryDays" = EXCLUDED."deliveryDays", skills = EXCLUDED.skills, "imageUrls" = EXCLUDED."imageUrls", status = EXCLUDED.status, "deletedAt" = NULL;

-- Backdate accounts, profiles, wallets, and listings so the order history that
-- follows is chronologically possible. Newer personas keep the admin's
-- "new users" chart populated without taking part in seeded orders.
UPDATE "User"
SET "createdAt" = CASE
  WHEN email IN (
    'client.one@skillshift.demo',
    'client.two@skillshift.demo',
    'maya@skillshift.demo',
    'noah@skillshift.demo',
    'zara@skillshift.demo',
    'leo@skillshift.demo'
  ) THEN now() - interval '120 days'
  WHEN email = 'tara@skillshift.demo' THEN now() - interval '28 days'
  WHEN email = 'kabir@skillshift.demo' THEN now() - interval '24 days'
  WHEN email = 'ananya@skillshift.demo' THEN now() - interval '18 days'
  WHEN email = 'dev@skillshift.demo' THEN now() - interval '12 days'
  WHEN email = 'admin@skillshift.demo' THEN now() - interval '150 days'
  ELSE now() - interval '120 days'
END
WHERE email LIKE '%@skillshift.demo';

UPDATE "Profile" p
SET "createdAt" = u."createdAt"
FROM "User" u
WHERE p."userId" = u.id AND u.email LIKE '%@skillshift.demo';

UPDATE "Wallet" w
SET "createdAt" = u."createdAt"
FROM "User" u
WHERE w."userId" = u.id AND u.email LIKE '%@skillshift.demo';

UPDATE "Service" s
SET "createdAt" = u."createdAt" + interval '1 day'
FROM "User" u
WHERE s."freelancerId" = u.id AND s.id LIKE '30000000-%';

INSERT INTO "Order" (id, "clientId", "freelancerId", "serviceId", status, price, "deliveryDays", requirements, "deliveryNote", "autoCompleteAt", "createdAt") VALUES
  ('40000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000011', '30000000-0000-4000-8000-000000000001', 'IN_PROGRESS', 2999900, 7, 'Need a calm, editorial identity for a climate analytics product.', NULL, NULL, now() - interval '4 days'),
  ('40000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000012', '30000000-0000-4000-8000-000000000002', 'DELIVERED', 4499900, 10, 'Please use the attached product notes and keep the page fast on mobile.', 'The responsive landing page and handoff notes are ready for review.', now() + interval '5 days', now() - interval '8 days'),
  ('40000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000011', '30000000-0000-4000-8000-000000000005', 'COMPLETED', 3999900, 9, 'Design a simple onboarding flow for a habit app.', 'Final Figma file and component notes delivered.', NULL, now() - interval '30 days'),
  ('40000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000013', '30000000-0000-4000-8000-000000000003', 'DISPUTED', 1499900, 5, 'Rewrite the homepage with a sharper enterprise message.', 'First draft delivered, but several requested sections are missing.', now() + interval '2 days', now() - interval '10 days'),
  ('40000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000014', '30000000-0000-4000-8000-000000000004', 'CANCELLED', 3299900, 8, 'Create a product launch animation for the new release.', NULL, NULL, now() - interval '20 days'),
  ('40000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000012', '30000000-0000-4000-8000-000000000006', 'COMPLETED', 5999900, 12, 'Connect the checkout flow to the existing API.', 'Integration shipped with error and loading states.', NULL, now() - interval '35 days'),
  ('40000000-0000-4000-8000-000000000007', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000014', '30000000-0000-4000-8000-000000000008', 'IN_PROGRESS', 2499900, 10, 'Edit a concise explainer for our product launch.', NULL, NULL, now() - interval '3 days'),
  ('40000000-0000-4000-8000-000000000008', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000013', '30000000-0000-4000-8000-000000000007', 'DELIVERED', 1199900, 4, 'Build a four-week SEO plan for a new marketplace.', 'The plan, keywords, and first briefs are ready.', now() + interval '6 days', now() - interval '5 days')
ON CONFLICT (id) DO UPDATE SET
  "clientId" = EXCLUDED."clientId",
  "freelancerId" = EXCLUDED."freelancerId",
  "serviceId" = EXCLUDED."serviceId",
  status = EXCLUDED.status,
  price = EXCLUDED.price,
  "deliveryDays" = EXCLUDED."deliveryDays",
  requirements = EXCLUDED.requirements,
  "deliveryNote" = EXCLUDED."deliveryNote",
  "autoCompleteAt" = EXCLUDED."autoCompleteAt",
  "createdAt" = EXCLUDED."createdAt";

-- Keep the order's last-updated timestamp aligned with the transition that
-- actually put it in its current state.
UPDATE "Order"
SET "updatedAt" = CASE id
  WHEN '40000000-0000-4000-8000-000000000001' THEN now() - interval '4 days'
  WHEN '40000000-0000-4000-8000-000000000002' THEN now() - interval '2 days'
  WHEN '40000000-0000-4000-8000-000000000003' THEN now() - interval '22 days'
  WHEN '40000000-0000-4000-8000-000000000004' THEN now() - interval '1 day'
  WHEN '40000000-0000-4000-8000-000000000005' THEN now() - interval '12 days'
  WHEN '40000000-0000-4000-8000-000000000006' THEN now() - interval '15 days'
  WHEN '40000000-0000-4000-8000-000000000007' THEN now() - interval '3 days'
  WHEN '40000000-0000-4000-8000-000000000008' THEN now() - interval '1 day'
  ELSE "updatedAt"
END
WHERE id LIKE '40000000-%';

INSERT INTO "Escrow" (id, "orderId", amount, status, "heldAt", "releasedAt", "refundedAt") VALUES
  ('50000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 2999900, 'HOLDING', now() - interval '4 days', NULL, NULL),
  ('50000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000002', 4499900, 'HOLDING', now() - interval '8 days', NULL, NULL),
  ('50000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000003', 3999900, 'RELEASED', now() - interval '30 days', now() - interval '22 days', NULL),
  ('50000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000004', 1499900, 'HOLDING', now() - interval '10 days', NULL, NULL),
  ('50000000-0000-4000-8000-000000000005', '40000000-0000-4000-8000-000000000005', 3299900, 'REFUNDED', now() - interval '20 days', NULL, now() - interval '12 days'),
  ('50000000-0000-4000-8000-000000000006', '40000000-0000-4000-8000-000000000006', 5999900, 'RELEASED', now() - interval '35 days', now() - interval '15 days', NULL),
  ('50000000-0000-4000-8000-000000000007', '40000000-0000-4000-8000-000000000007', 2499900, 'HOLDING', now() - interval '3 days', NULL, NULL),
  ('50000000-0000-4000-8000-000000000008', '40000000-0000-4000-8000-000000000008', 1199900, 'HOLDING', now() - interval '5 days', NULL, NULL)
ON CONFLICT ("orderId") DO UPDATE SET
  amount = EXCLUDED.amount,
  status = EXCLUDED.status,
  "heldAt" = EXCLUDED."heldAt",
  "releasedAt" = EXCLUDED."releasedAt",
  "refundedAt" = EXCLUDED."refundedAt";

INSERT INTO "Transaction" (id, "walletId", type, amount, description, "orderId", "createdAt") VALUES
  ('60000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'DEPOSIT', 50000000, 'Initial demo wallet funding', NULL, now() - interval '45 days'),
  ('60000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'ESCROW_HOLD', 2999900, 'Escrow hold for brand identity order', '40000000-0000-4000-8000-000000000001', now() - interval '4 days'),
  ('60000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001', 'ESCROW_HOLD', 4499900, 'Escrow hold for landing page order', '40000000-0000-4000-8000-000000000002', now() - interval '8 days'),
  ('60000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000001', 'ESCROW_REFUND', 3299900, 'Refund for cancelled motion order', '40000000-0000-4000-8000-000000000005', now() - interval '12 days'),
  ('60000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000002', 'DEPOSIT', 50000000, 'Initial demo wallet funding', NULL, now() - interval '45 days'),
  ('60000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000011', 'ESCROW_RELEASE', 3999900, 'Payment received for completed order', '40000000-0000-4000-8000-000000000003', now() - interval '22 days'),
  ('60000000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000012', 'ESCROW_RELEASE', 5999900, 'Payment received for completed order', '40000000-0000-4000-8000-000000000006', now() - interval '15 days'),
  ('60000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000012', 'WITHDRAWAL', 2500000, 'Demo earnings withdrawal', NULL, now() - interval '10 days'),
  ('60000000-0000-4000-8000-000000000009', '20000000-0000-4000-8000-000000000013', 'DEPOSIT', 12500000, 'Demo earnings balance', NULL, now() - interval '40 days'),
  ('60000000-0000-4000-8000-000000000010', '20000000-0000-4000-8000-000000000014', 'DEPOSIT', 9800000, 'Demo earnings balance', NULL, now() - interval '40 days'),
  ('60000000-0000-4000-8000-000000000011', '20000000-0000-4000-8000-000000000002', 'ESCROW_HOLD', 1499900, 'Escrow hold for copy order', '40000000-0000-4000-8000-000000000004', now() - interval '10 days'),
  ('60000000-0000-4000-8000-000000000012', '20000000-0000-4000-8000-000000000002', 'ESCROW_HOLD', 2499900, 'Escrow hold for explainer order', '40000000-0000-4000-8000-000000000007', now() - interval '3 days'),
  ('60000000-0000-4000-8000-000000000013', '20000000-0000-4000-8000-000000000001', 'ESCROW_HOLD', 1199900, 'Escrow hold for SEO plan order', '40000000-0000-4000-8000-000000000008', now() - interval '5 days'),
  ('60000000-0000-4000-8000-000000000014', '20000000-0000-4000-8000-000000000001', 'ESCROW_HOLD', 5999900, 'Escrow hold for API integration order', '40000000-0000-4000-8000-000000000006', now() - interval '35 days'),
  ('60000000-0000-4000-8000-000000000015', '20000000-0000-4000-8000-000000000001', 'ESCROW_HOLD', 3299900, 'Escrow hold for motion order', '40000000-0000-4000-8000-000000000005', now() - interval '20 days'),
  ('60000000-0000-4000-8000-000000000016', '20000000-0000-4000-8000-000000000015', 'DEPOSIT', 18500000, 'Demo earnings balance', NULL, now() - interval '27 days'),
  ('60000000-0000-4000-8000-000000000017', '20000000-0000-4000-8000-000000000016', 'DEPOSIT', 8250000, 'Demo earnings balance', NULL, now() - interval '23 days'),
  ('60000000-0000-4000-8000-000000000018', '20000000-0000-4000-8000-000000000017', 'DEPOSIT', 10450000, 'Demo earnings balance', NULL, now() - interval '17 days'),
  ('60000000-0000-4000-8000-000000000019', '20000000-0000-4000-8000-000000000018', 'DEPOSIT', 16700000, 'Demo earnings balance', NULL, now() - interval '11 days'),
  ('60000000-0000-4000-8000-000000000020', '20000000-0000-4000-8000-000000000011', 'DEPOSIT', 5450100, 'Demo earnings balance', NULL, now() - interval '40 days'),
  ('60000000-0000-4000-8000-000000000021', '20000000-0000-4000-8000-000000000012', 'DEPOSIT', 24000100, 'Demo earnings balance', NULL, now() - interval '40 days'),
  ('60000000-0000-4000-8000-000000000022', '20000000-0000-4000-8000-000000000002', 'ESCROW_HOLD', 3999900, 'Escrow hold for mobile screens order', '40000000-0000-4000-8000-000000000003', now() - interval '30 days')
ON CONFLICT (id) DO UPDATE SET
  "walletId" = EXCLUDED."walletId",
  type = EXCLUDED.type,
  amount = EXCLUDED.amount,
  description = EXCLUDED.description,
  "orderId" = EXCLUDED."orderId",
  "createdAt" = EXCLUDED."createdAt";

INSERT INTO "Review" (id, "orderId", "serviceId", "reviewerId", "revieweeId", rating, comment, "createdAt") VALUES
  ('70000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000011', 5, 'Thoughtful work, clear handoff, and excellent component detail.', now() - interval '21 days'),
  ('70000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000006', '30000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000012', 5, 'Fast implementation and great communication throughout.', now() - interval '14 days')
ON CONFLICT ("orderId") DO UPDATE SET
  "serviceId" = EXCLUDED."serviceId",
  "reviewerId" = EXCLUDED."reviewerId",
  "revieweeId" = EXCLUDED."revieweeId",
  rating = EXCLUDED.rating,
  comment = EXCLUDED.comment,
  "createdAt" = EXCLUDED."createdAt";

INSERT INTO "Dispute" (id, "orderId", "clientId", reason, status, "adminNote", "resolvedAt", "createdAt") VALUES
  ('80000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000002', 'The copy delivery is missing the requested enterprise section.', 'OPEN', NULL, NULL, now() - interval '1 day')
ON CONFLICT ("orderId") DO UPDATE SET
  "clientId" = EXCLUDED."clientId",
  reason = EXCLUDED.reason,
  status = EXCLUDED.status,
  "adminNote" = EXCLUDED."adminNote",
  "resolvedAt" = EXCLUDED."resolvedAt",
  "createdAt" = EXCLUDED."createdAt";

INSERT INTO "Conversation" (id, "orderId", "createdAt") VALUES
  ('90000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', now() - interval '4 days'),
  ('90000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000002', now() - interval '8 days'),
  ('90000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000004', now() - interval '10 days')
ON CONFLICT ("orderId") DO UPDATE SET "createdAt" = EXCLUDED."createdAt";

INSERT INTO "Message" (id, "conversationId", "senderId", content, "createdAt") VALUES
  ('91000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'Hi Maya, I have shared the product notes and references.', now() - interval '4 days'),
  ('91000000-0000-4000-8000-000000000002', '90000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000011', 'Thanks Aarav. I will share the first direction tomorrow.', now() - interval '3 days'),
  ('91000000-0000-4000-8000-000000000003', '90000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000012', 'The responsive build is ready for your review.', now() - interval '2 days'),
  ('91000000-0000-4000-8000-000000000004', '90000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000002', 'Could you add the enterprise proof points to the next revision?', now() - interval '2 days')
ON CONFLICT (id) DO UPDATE SET
  "conversationId" = EXCLUDED."conversationId",
  "senderId" = EXCLUDED."senderId",
  content = EXCLUDED.content,
  "createdAt" = EXCLUDED."createdAt";

INSERT INTO "Notification" (id, "userId", type, title, body, "orderId", "isRead", "createdAt") VALUES
  ('a0000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'ORDER_DELIVERED', 'Order delivered', 'Your Next.js landing page is ready for review.', '40000000-0000-4000-8000-000000000002', false, now() - interval '2 days'),
  ('a0000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000011', 'ORDER_PLACED', 'New order received', 'Aarav placed a brand identity order.', '40000000-0000-4000-8000-000000000001', true, now() - interval '4 days'),
  ('a0000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000099', 'DISPUTE_OPENED', 'New dispute opened', 'An order needs admin review.', '40000000-0000-4000-8000-000000000004', false, now() - interval '1 day'),
  ('a0000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000012', 'ORDER_COMPLETED', 'Order completed', 'Your order has been completed and payment has been released.', '40000000-0000-4000-8000-000000000006', true, now() - interval '15 days'),
  ('a0000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000013', 'MESSAGE_RECEIVED', 'New message', 'Diya sent you a message about the website copy order.', '40000000-0000-4000-8000-000000000004', false, now() - interval '2 days'),
  ('a0000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000014', 'ORDER_CANCELLED', 'Order cancelled', 'An order you were involved in has been cancelled and the payment has been refunded.', '40000000-0000-4000-8000-000000000005', true, now() - interval '12 days'),
  ('a0000000-0000-4000-8000-000000000007', '00000000-0000-4000-8000-000000000011', 'REVIEW_RECEIVED', 'New review received', 'You received a new review for Figma mobile app screens.', '40000000-0000-4000-8000-000000000003', true, now() - interval '21 days'),
  ('a0000000-0000-4000-8000-000000000008', '00000000-0000-4000-8000-000000000012', 'REVIEW_RECEIVED', 'New review received', 'You received a new review for API integration sprint.', '40000000-0000-4000-8000-000000000006', true, now() - interval '14 days')
ON CONFLICT (id) DO UPDATE SET
  "userId" = EXCLUDED."userId",
  type = EXCLUDED.type,
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  "orderId" = EXCLUDED."orderId",
  "isRead" = EXCLUDED."isRead",
  "createdAt" = EXCLUDED."createdAt";

INSERT INTO "AuditLog" (id, "userId", "orderId", action, before, after, "createdAt") VALUES
  ('b0000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 'ORDER_STATUS_CHANGED', '{"status":null}', '{"status":"IN_PROGRESS"}', now() - interval '4 days'),
  ('b0000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000012', '40000000-0000-4000-8000-000000000002', 'ORDER_STATUS_CHANGED', '{"status":"IN_PROGRESS"}', '{"status":"DELIVERED"}', now() - interval '2 days'),
  ('b0000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000004', 'DISPUTE_OPENED', '{"orderStatus":"DELIVERED"}', '{"orderStatus":"DISPUTED"}', now() - interval '1 day'),
  ('b0000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000003', 'ORDER_STATUS_CHANGED', '{"status":"DELIVERED"}', '{"status":"COMPLETED"}', now() - interval '22 days'),
  ('b0000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000006', 'ORDER_STATUS_CHANGED', '{"status":"DELIVERED"}', '{"status":"COMPLETED"}', now() - interval '15 days'),
  ('b0000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000005', 'ORDER_STATUS_CHANGED', '{"status":"IN_PROGRESS"}', '{"status":"CANCELLED"}', now() - interval '12 days')
ON CONFLICT (id) DO UPDATE SET
  "userId" = EXCLUDED."userId",
  "orderId" = EXCLUDED."orderId",
  action = EXCLUDED.action,
  before = EXCLUDED.before,
  after = EXCLUDED.after,
  "createdAt" = EXCLUDED."createdAt";


-- Additional demo accounts and pending listings
INSERT INTO "User" (id, email, "passwordHash", role, "isEmailVerified", "createdAt") VALUES
  ('00000000-0000-4000-8000-000000000003', 'priya@skillshift.demo', '$2b$10$O5YiAncLBt9waOxaUsX9fertdAOsiZGqD36fukQSJpD9KdxEyiSYe', 'CLIENT', true, now() - interval '75 days'),
  ('00000000-0000-4000-8000-000000000004', 'daniel@skillshift.demo', '$2b$10$O5YiAncLBt9waOxaUsX9fertdAOsiZGqD36fukQSJpD9KdxEyiSYe', 'CLIENT', true, now() - interval '60 days')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  "isEmailVerified" = true,
  "createdAt" = EXCLUDED."createdAt",
  "emailVerifyTokenHash" = NULL,
  "emailVerifyTokenExpiresAt" = NULL,
  "passwordResetTokenHash" = NULL,
  "passwordResetExpiresAt" = NULL,
  "deletedAt" = NULL;

INSERT INTO "Profile" (id, "userId", "displayName", bio, "avatarUrl", skills, "portfolioUrls", rating, "totalReviews", "createdAt") VALUES
  ('10000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000003', 'Priya Nair', 'Product lead exploring new tools with her team.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&crop=faces&w=400&h=400&q=80', ARRAY['product','research'], ARRAY[]::text[], 0, 0, now() - interval '75 days'),
  ('10000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000004', 'Daniel Okafor', 'Founder building a small portfolio of useful software.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&crop=faces&w=400&h=400&q=80', ARRAY['startups','operations'], ARRAY[]::text[], 0, 0, now() - interval '60 days')
ON CONFLICT ("userId") DO UPDATE SET
  "displayName" = EXCLUDED."displayName",
  bio = EXCLUDED.bio,
  "avatarUrl" = EXCLUDED."avatarUrl",
  skills = EXCLUDED.skills,
  "portfolioUrls" = EXCLUDED."portfolioUrls",
  rating = EXCLUDED.rating,
  "totalReviews" = EXCLUDED."totalReviews",
  "createdAt" = EXCLUDED."createdAt";

INSERT INTO "Wallet" (id, "userId", balance, "createdAt") VALUES
  ('20000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000003', 16400800, now() - interval '75 days'),
  ('20000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000004', 30000000, now() - interval '60 days')
ON CONFLICT ("userId") DO UPDATE SET
  balance = EXCLUDED.balance,
  "createdAt" = EXCLUDED."createdAt";

INSERT INTO "Service" (id, "freelancerId", title, description, price, "deliveryDays", skills, "imageUrls", status, "createdAt") VALUES
  ('30000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000011', 'Brand messaging workshop', 'A half-day workshop that turns your product story into a clear message hierarchy for sales, marketing, and product.', 1999900, 5, ARRAY['branding','messaging','workshop'], ARRAY[
    'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1600&h=1000&q=80'
  ]::text[], 'PENDING_REVIEW', now() - interval '12 days'),
  ('30000000-0000-4000-8000-000000000032', '00000000-0000-4000-8000-000000000012', 'API observability setup', 'Structured logs, useful metrics, and actionable alerts for a Node API that needs calmer production operations.', 4499900, 8, ARRAY['api','observability','monitoring'], ARRAY[
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&h=1000&q=80'
  ]::text[], 'PENDING_REVIEW', now() - interval '9 days'),
  ('30000000-0000-4000-8000-000000000033', '00000000-0000-4000-8000-000000000013', 'Lifecycle email audit', 'A practical audit of your onboarding, nurture, and win-back emails with prioritised rewrites and a measurement plan.', 899900, 4, ARRAY['email-marketing','copywriting','audit'], ARRAY[
    'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=1600&h=1000&q=80',
    'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1600&h=1000&q=80'
  ]::text[], 'PENDING_REVIEW', now() - interval '7 days')
ON CONFLICT (id) DO UPDATE SET
  "freelancerId" = EXCLUDED."freelancerId",
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  "deliveryDays" = EXCLUDED."deliveryDays",
  skills = EXCLUDED.skills,
  "imageUrls" = EXCLUDED."imageUrls",
  status = EXCLUDED.status,
  "createdAt" = EXCLUDED."createdAt",
  "deletedAt" = NULL;

-- Completed order history and one resolved-client refund
INSERT INTO "Order" (id, "clientId", "freelancerId", "serviceId", status, price, "deliveryDays", requirements, "deliveryNote", "autoCompleteAt", "createdAt", "updatedAt") VALUES
  ('40000000-0000-4000-8000-000000000009', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000011', '30000000-0000-4000-8000-000000000001', 'COMPLETED', 2999900, 7, 'Create a calm, editorial identity for our climate analytics product. The attached brief includes references and a full asset list.', 'Final logo suite, colour and type system, and usage guide are in the shared folder.', NULL, now() - interval '38 days', now() - interval '30 days'),
  ('40000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000011', '30000000-0000-4000-8000-000000000001', 'COMPLETED', 2999900, 7, 'We need a compact identity kit for a new coffee subscription. Keep the palette warm and the wordmark practical.', 'Delivered the logo suite, packaging marks, and a short brand guide.', NULL, now() - interval '24 days', now() - interval '16 days'),
  ('40000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000011', '30000000-0000-4000-8000-000000000014', 'COMPLETED', 1799900, 8, 'Turn our seed deck into a clear investor story for a pre-seed raise.', 'The revised narrative, 12 slides, and speaker notes are ready.', NULL, now() - interval '29 days', now() - interval '20 days'),
  ('40000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000011', '30000000-0000-4000-8000-000000000027', 'COMPLETED', 1699900, 6, 'Audit our checkout and account settings for WCAG 2.2 AA issues, then re-test the fixes.', 'Audit report, prioritised fixes, and re-test notes are in the delivery.', NULL, now() - interval '16 days', now() - interval '9 days'),
  ('40000000-0000-4000-8000-000000000013', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000012', '30000000-0000-4000-8000-000000000002', 'COMPLETED', 4499900, 10, 'Build a responsive landing page from the attached Figma file and product notes. Prioritise mobile performance.', 'The responsive build, content notes, and deployment instructions are ready.', NULL, now() - interval '39 days', now() - interval '28 days'),
  ('40000000-0000-4000-8000-000000000014', '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000012', '30000000-0000-4000-8000-000000000002', 'COMPLETED', 4499900, 10, 'We need a fast landing page for a developer tools launch, with a clear pricing section.', 'Shipped the page, pricing section, and handoff notes for the team.', NULL, now() - interval '23 days', now() - interval '12 days'),
  ('40000000-0000-4000-8000-000000000015', '00000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000012', '30000000-0000-4000-8000-000000000013', 'COMPLETED', 4999900, 14, 'Build a product analytics dashboard that replaces our weekly spreadsheet review.', 'Dashboard, saved views, and a short data dictionary are included.', NULL, now() - interval '38 days', now() - interval '23 days'),
  ('40000000-0000-4000-8000-000000000016', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000012', '30000000-0000-4000-8000-000000000028', 'COMPLETED', 3999900, 10, 'Add Stripe subscriptions and webhooks to our existing checkout flow.', 'Billing flow, webhook handlers, and a test-mode walkthrough are ready.', NULL, now() - interval '26 days', now() - interval '15 days'),
  ('40000000-0000-4000-8000-000000000017', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000012', '30000000-0000-4000-8000-000000000029', 'COMPLETED', 6499900, 14, 'Create a React Native MVP with email auth and four core screens for TestFlight.', 'The TestFlight build, source, and setup notes are in the handoff.', NULL, now() - interval '35 days', now() - interval '20 days'),
  ('40000000-0000-4000-8000-000000000018', '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000013', '30000000-0000-4000-8000-000000000003', 'COMPLETED', 1499900, 5, 'Rewrite our homepage around one clear promise and keep the proof points specific.', 'New homepage copy, CTA variants, and a rationale doc are ready.', NULL, now() - interval '37 days', now() - interval '31 days'),
  ('40000000-0000-4000-8000-000000000019', '00000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000013', '30000000-0000-4000-8000-000000000007', 'COMPLETED', 1199900, 4, 'Build a practical 30-day SEO content plan for our marketplace launch.', 'The plan, keyword map, and first four briefs are included.', NULL, now() - interval '29 days', now() - interval '24 days'),
  ('40000000-0000-4000-8000-000000000020', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000013', '30000000-0000-4000-8000-000000000011', 'COMPLETED', 999900, 6, 'Write a founder story for our press page that sounds human and specific.', 'The edited story, pull quotes, and a short version are ready.', NULL, now() - interval '25 days', now() - interval '18 days'),
  ('40000000-0000-4000-8000-000000000021', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000013', '30000000-0000-4000-8000-000000000015', 'COMPLETED', 799900, 5, 'Rewrite the onboarding microcopy for our checkout and empty states.', 'Updated microcopy, error states, and a terminology note are included.', NULL, now() - interval '19 days', now() - interval '13 days'),
  ('40000000-0000-4000-8000-000000000022', '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000013', '30000000-0000-4000-8000-000000000025', 'COMPLETED', 1499900, 6, 'Write a quickstart and API reference for our payments API, with copy-paste examples.', 'Quickstart, endpoint reference, and example snippets are ready.', NULL, now() - interval '15 days', now() - interval '8 days'),
  ('40000000-0000-4000-8000-000000000023', '00000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000013', '30000000-0000-4000-8000-000000000030', 'COMPLETED', 599900, 4, 'Rewrite my resume and LinkedIn profile for senior product roles.', 'The rewritten resume, LinkedIn copy, and a role-targeting note are ready.', NULL, now() - interval '8 days', now() - interval '3 days'),
  ('40000000-0000-4000-8000-000000000024', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000014', '30000000-0000-4000-8000-000000000004', 'COMPLETED', 3299900, 8, 'Create three launch motion assets for our new product release.', 'Three exports in square, landscape, and vertical formats are ready.', NULL, now() - interval '38 days', now() - interval '29 days'),
  ('40000000-0000-4000-8000-000000000025', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000014', '30000000-0000-4000-8000-000000000004', 'COMPLETED', 3299900, 8, 'We need a polished product launch animation with a version for social.', 'The master animation, social cut, and source file are included.', NULL, now() - interval '23 days', now() - interval '14 days'),
  ('40000000-0000-4000-8000-000000000026', '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000014', '30000000-0000-4000-8000-000000000008', 'COMPLETED', 2499900, 10, 'Edit a two-minute explainer with captions and a calm pacing pass.', 'The final edit, captioned versions, and thumbnail options are ready.', NULL, now() - interval '32 days', now() - interval '21 days'),
  ('40000000-0000-4000-8000-000000000027', '00000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000014', '30000000-0000-4000-8000-000000000026', 'COMPLETED', 1899900, 7, 'Animate our logo for the product header and export a Lottie file.', 'Lottie, MP4, and usage notes are in the delivery.', NULL, now() - interval '15 days', now() - interval '7 days'),
  ('40000000-0000-4000-8000-000000000028', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000015', '30000000-0000-4000-8000-000000000016', 'COMPLETED', 3499900, 10, 'Set up our Shopify store from the brand kit and prepare it for launch.', 'Theme, products, payments, and a launch checklist are ready.', NULL, now() - interval '24 days', now() - interval '13 days'),
  ('40000000-0000-4000-8000-000000000029', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000015', '30000000-0000-4000-8000-000000000016', 'COMPLETED', 3499900, 10, 'Launch a second Shopify store for our seasonal collection.', 'The store, collection pages, and mobile QA notes are ready.', NULL, now() - interval '15 days', now() - interval '4 days'),
  ('40000000-0000-4000-8000-000000000030', '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000015', '30000000-0000-4000-8000-000000000017', 'COMPLETED', 2799900, 8, 'Build our Webflow marketing site with CMS collections and editor training.', 'The site, CMS setup, and editor walkthrough are ready.', NULL, now() - interval '20 days', now() - interval '11 days'),
  ('40000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000015', '30000000-0000-4000-8000-000000000017', 'COMPLETED', 2799900, 8, 'We need a compact Webflow site for a campaign landing page before Friday.', 'The campaign page, CMS setup, and publish checklist are ready.', NULL, now() - interval '11 days', now() - interval '2 days'),
  ('40000000-0000-4000-8000-000000000032', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000016', '30000000-0000-4000-8000-000000000018', 'COMPLETED', 499900, 3, 'Edit our first podcast episode with noise removal, chapters, and show notes.', 'The edited episode, chapter markers, and show notes are ready.', NULL, now() - interval '21 days', now() - interval '17 days'),
  ('40000000-0000-4000-8000-000000000033', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000016', '30000000-0000-4000-8000-000000000019', 'COMPLETED', 1299900, 6, 'Cut eight vertical clips from our launch webinar with captions and hooks.', 'Eight captioned edits and a posting guide are ready.', NULL, now() - interval '16 days', now() - interval '9 days'),
  ('40000000-0000-4000-8000-000000000034', '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000016', '30000000-0000-4000-8000-000000000020', 'COMPLETED', 999900, 4, 'Retouch 25 product photos for a consistent catalog look.', 'Twenty-five retouched images and a colour reference are ready.', NULL, now() - interval '8 days', now() - interval '3 days'),
  ('40000000-0000-4000-8000-000000000035', '00000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000017', '30000000-0000-4000-8000-000000000021', 'COMPLETED', 1199900, 6, 'Build a five-email welcome sequence that reflects our new pricing page.', 'Five emails, subject-line options, and a send schedule are ready.', NULL, now() - interval '16 days', now() - interval '9 days'),
  ('40000000-0000-4000-8000-000000000036', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000017', '30000000-0000-4000-8000-000000000022', 'COMPLETED', 1799900, 10, 'Run a two-week social sprint for our founder-led launch.', 'The calendar, twelve posts, and a metric review are ready.', NULL, now() - interval '14 days', now() - interval '3 days'),
  ('40000000-0000-4000-8000-000000000037', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000018', '30000000-0000-4000-8000-000000000023', 'COMPLETED', 2499900, 7, 'Set up a Supabase schema with row-level security for team and individual accounts.', 'Schema, policies, seed data, and a typed client example are ready.', NULL, now() - interval '10 days', now() - interval '3 days'),
  ('40000000-0000-4000-8000-000000000038', '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000018', '30000000-0000-4000-8000-000000000024', 'COMPLETED', 2999900, 9, 'Build a BI dashboard from our product events with the metrics we review weekly.', 'Dashboard, metric definitions, and a short walkthrough are ready.', NULL, now() - interval '11 days', now() - interval '1 day'),
  ('40000000-0000-4000-8000-000000000039', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000013', '30000000-0000-4000-8000-000000000030', 'REFUNDED', 599900, 4, 'Rewrite my resume and LinkedIn profile for senior product roles.', 'First draft delivered, but the agreed senior-role positioning section was missing.', NULL, now() - interval '20 days', now() - interval '4 days')
ON CONFLICT (id) DO UPDATE SET
  "clientId" = EXCLUDED."clientId",
  "freelancerId" = EXCLUDED."freelancerId",
  "serviceId" = EXCLUDED."serviceId",
  status = EXCLUDED.status,
  price = EXCLUDED.price,
  "deliveryDays" = EXCLUDED."deliveryDays",
  requirements = EXCLUDED.requirements,
  "deliveryNote" = EXCLUDED."deliveryNote",
  "autoCompleteAt" = EXCLUDED."autoCompleteAt",
  "createdAt" = EXCLUDED."createdAt",
  "updatedAt" = EXCLUDED."updatedAt";

INSERT INTO "Escrow" (id, "orderId", amount, status, "heldAt", "releasedAt", "refundedAt") VALUES
  ('50000000-0000-4000-8000-000000000009', '40000000-0000-4000-8000-000000000009', 2999900, 'RELEASED', now() - interval '38 days', now() - interval '30 days', NULL),
  ('50000000-0000-4000-8000-000000000010', '40000000-0000-4000-8000-000000000010', 2999900, 'RELEASED', now() - interval '24 days', now() - interval '16 days', NULL),
  ('50000000-0000-4000-8000-000000000011', '40000000-0000-4000-8000-000000000011', 1799900, 'RELEASED', now() - interval '29 days', now() - interval '20 days', NULL),
  ('50000000-0000-4000-8000-000000000012', '40000000-0000-4000-8000-000000000012', 1699900, 'RELEASED', now() - interval '16 days', now() - interval '9 days', NULL),
  ('50000000-0000-4000-8000-000000000013', '40000000-0000-4000-8000-000000000013', 4499900, 'RELEASED', now() - interval '39 days', now() - interval '28 days', NULL),
  ('50000000-0000-4000-8000-000000000014', '40000000-0000-4000-8000-000000000014', 4499900, 'RELEASED', now() - interval '23 days', now() - interval '12 days', NULL),
  ('50000000-0000-4000-8000-000000000015', '40000000-0000-4000-8000-000000000015', 4999900, 'RELEASED', now() - interval '38 days', now() - interval '23 days', NULL),
  ('50000000-0000-4000-8000-000000000016', '40000000-0000-4000-8000-000000000016', 3999900, 'RELEASED', now() - interval '26 days', now() - interval '15 days', NULL),
  ('50000000-0000-4000-8000-000000000017', '40000000-0000-4000-8000-000000000017', 6499900, 'RELEASED', now() - interval '35 days', now() - interval '20 days', NULL),
  ('50000000-0000-4000-8000-000000000018', '40000000-0000-4000-8000-000000000018', 1499900, 'RELEASED', now() - interval '37 days', now() - interval '31 days', NULL),
  ('50000000-0000-4000-8000-000000000019', '40000000-0000-4000-8000-000000000019', 1199900, 'RELEASED', now() - interval '29 days', now() - interval '24 days', NULL),
  ('50000000-0000-4000-8000-000000000020', '40000000-0000-4000-8000-000000000020', 999900, 'RELEASED', now() - interval '25 days', now() - interval '18 days', NULL),
  ('50000000-0000-4000-8000-000000000021', '40000000-0000-4000-8000-000000000021', 799900, 'RELEASED', now() - interval '19 days', now() - interval '13 days', NULL),
  ('50000000-0000-4000-8000-000000000022', '40000000-0000-4000-8000-000000000022', 1499900, 'RELEASED', now() - interval '15 days', now() - interval '8 days', NULL),
  ('50000000-0000-4000-8000-000000000023', '40000000-0000-4000-8000-000000000023', 599900, 'RELEASED', now() - interval '8 days', now() - interval '3 days', NULL),
  ('50000000-0000-4000-8000-000000000024', '40000000-0000-4000-8000-000000000024', 3299900, 'RELEASED', now() - interval '38 days', now() - interval '29 days', NULL),
  ('50000000-0000-4000-8000-000000000025', '40000000-0000-4000-8000-000000000025', 3299900, 'RELEASED', now() - interval '23 days', now() - interval '14 days', NULL),
  ('50000000-0000-4000-8000-000000000026', '40000000-0000-4000-8000-000000000026', 2499900, 'RELEASED', now() - interval '32 days', now() - interval '21 days', NULL),
  ('50000000-0000-4000-8000-000000000027', '40000000-0000-4000-8000-000000000027', 1899900, 'RELEASED', now() - interval '15 days', now() - interval '7 days', NULL),
  ('50000000-0000-4000-8000-000000000028', '40000000-0000-4000-8000-000000000028', 3499900, 'RELEASED', now() - interval '24 days', now() - interval '13 days', NULL),
  ('50000000-0000-4000-8000-000000000029', '40000000-0000-4000-8000-000000000029', 3499900, 'RELEASED', now() - interval '15 days', now() - interval '4 days', NULL),
  ('50000000-0000-4000-8000-000000000030', '40000000-0000-4000-8000-000000000030', 2799900, 'RELEASED', now() - interval '20 days', now() - interval '11 days', NULL),
  ('50000000-0000-4000-8000-000000000031', '40000000-0000-4000-8000-000000000031', 2799900, 'RELEASED', now() - interval '11 days', now() - interval '2 days', NULL),
  ('50000000-0000-4000-8000-000000000032', '40000000-0000-4000-8000-000000000032', 499900, 'RELEASED', now() - interval '21 days', now() - interval '17 days', NULL),
  ('50000000-0000-4000-8000-000000000033', '40000000-0000-4000-8000-000000000033', 1299900, 'RELEASED', now() - interval '16 days', now() - interval '9 days', NULL),
  ('50000000-0000-4000-8000-000000000034', '40000000-0000-4000-8000-000000000034', 999900, 'RELEASED', now() - interval '8 days', now() - interval '3 days', NULL),
  ('50000000-0000-4000-8000-000000000035', '40000000-0000-4000-8000-000000000035', 1199900, 'RELEASED', now() - interval '16 days', now() - interval '9 days', NULL),
  ('50000000-0000-4000-8000-000000000036', '40000000-0000-4000-8000-000000000036', 1799900, 'RELEASED', now() - interval '14 days', now() - interval '3 days', NULL),
  ('50000000-0000-4000-8000-000000000037', '40000000-0000-4000-8000-000000000037', 2499900, 'RELEASED', now() - interval '10 days', now() - interval '3 days', NULL),
  ('50000000-0000-4000-8000-000000000038', '40000000-0000-4000-8000-000000000038', 2999900, 'RELEASED', now() - interval '11 days', now() - interval '1 day', NULL),
  ('50000000-0000-4000-8000-000000000039', '40000000-0000-4000-8000-000000000039', 599900, 'REFUNDED', now() - interval '20 days', NULL, now() - interval '4 days')
ON CONFLICT ("orderId") DO UPDATE SET
  amount = EXCLUDED.amount,
  status = EXCLUDED.status,
  "heldAt" = EXCLUDED."heldAt",
  "releasedAt" = EXCLUDED."releasedAt",
  "refundedAt" = EXCLUDED."refundedAt";

INSERT INTO "Transaction" (id, "walletId", type, amount, description, "orderId", "createdAt") VALUES
  ('60000000-0000-4000-8000-000000000023', '20000000-0000-4000-8000-000000000001', 'ESCROW_HOLD', 2999900, 'Escrow hold for Brand identity starter kit', '40000000-0000-4000-8000-000000000009', now() - interval '38 days'),
  ('60000000-0000-4000-8000-000000000024', '20000000-0000-4000-8000-000000000011', 'ESCROW_RELEASE', 2999900, 'Payment released for Brand identity starter kit', '40000000-0000-4000-8000-000000000009', now() - interval '30 days'),
  ('60000000-0000-4000-8000-000000000025', '20000000-0000-4000-8000-000000000002', 'ESCROW_HOLD', 2999900, 'Escrow hold for Brand identity starter kit', '40000000-0000-4000-8000-000000000010', now() - interval '24 days'),
  ('60000000-0000-4000-8000-000000000026', '20000000-0000-4000-8000-000000000011', 'ESCROW_RELEASE', 2999900, 'Payment released for Brand identity starter kit', '40000000-0000-4000-8000-000000000010', now() - interval '16 days'),
  ('60000000-0000-4000-8000-000000000027', '20000000-0000-4000-8000-000000000003', 'ESCROW_HOLD', 1799900, 'Escrow hold for Pitch deck design and storytelling', '40000000-0000-4000-8000-000000000011', now() - interval '29 days'),
  ('60000000-0000-4000-8000-000000000028', '20000000-0000-4000-8000-000000000011', 'ESCROW_RELEASE', 1799900, 'Payment released for Pitch deck design and storytelling', '40000000-0000-4000-8000-000000000011', now() - interval '20 days'),
  ('60000000-0000-4000-8000-000000000029', '20000000-0000-4000-8000-000000000004', 'ESCROW_HOLD', 1699900, 'Escrow hold for WCAG 2.2 accessibility audit', '40000000-0000-4000-8000-000000000012', now() - interval '16 days'),
  ('60000000-0000-4000-8000-000000000030', '20000000-0000-4000-8000-000000000011', 'ESCROW_RELEASE', 1699900, 'Payment released for WCAG 2.2 accessibility audit', '40000000-0000-4000-8000-000000000012', now() - interval '9 days'),
  ('60000000-0000-4000-8000-000000000031', '20000000-0000-4000-8000-000000000002', 'ESCROW_HOLD', 4499900, 'Escrow hold for Next.js product landing page', '40000000-0000-4000-8000-000000000013', now() - interval '39 days'),
  ('60000000-0000-4000-8000-000000000032', '20000000-0000-4000-8000-000000000012', 'ESCROW_RELEASE', 4499900, 'Payment released for Next.js product landing page', '40000000-0000-4000-8000-000000000013', now() - interval '28 days'),
  ('60000000-0000-4000-8000-000000000033', '20000000-0000-4000-8000-000000000003', 'ESCROW_HOLD', 4499900, 'Escrow hold for Next.js product landing page', '40000000-0000-4000-8000-000000000014', now() - interval '23 days'),
  ('60000000-0000-4000-8000-000000000034', '20000000-0000-4000-8000-000000000012', 'ESCROW_RELEASE', 4499900, 'Payment released for Next.js product landing page', '40000000-0000-4000-8000-000000000014', now() - interval '12 days'),
  ('60000000-0000-4000-8000-000000000035', '20000000-0000-4000-8000-000000000004', 'ESCROW_HOLD', 4999900, 'Escrow hold for Product analytics dashboard build', '40000000-0000-4000-8000-000000000015', now() - interval '38 days'),
  ('60000000-0000-4000-8000-000000000036', '20000000-0000-4000-8000-000000000012', 'ESCROW_RELEASE', 4999900, 'Payment released for Product analytics dashboard build', '40000000-0000-4000-8000-000000000015', now() - interval '23 days'),
  ('60000000-0000-4000-8000-000000000037', '20000000-0000-4000-8000-000000000001', 'ESCROW_HOLD', 3999900, 'Escrow hold for Stripe billing integration', '40000000-0000-4000-8000-000000000016', now() - interval '26 days'),
  ('60000000-0000-4000-8000-000000000038', '20000000-0000-4000-8000-000000000012', 'ESCROW_RELEASE', 3999900, 'Payment released for Stripe billing integration', '40000000-0000-4000-8000-000000000016', now() - interval '15 days'),
  ('60000000-0000-4000-8000-000000000039', '20000000-0000-4000-8000-000000000002', 'ESCROW_HOLD', 6499900, 'Escrow hold for React Native MVP (auth + 4 screens)', '40000000-0000-4000-8000-000000000017', now() - interval '35 days'),
  ('60000000-0000-4000-8000-000000000040', '20000000-0000-4000-8000-000000000012', 'ESCROW_RELEASE', 6499900, 'Payment released for React Native MVP (auth + 4 screens)', '40000000-0000-4000-8000-000000000017', now() - interval '20 days'),
  ('60000000-0000-4000-8000-000000000041', '20000000-0000-4000-8000-000000000003', 'ESCROW_HOLD', 1499900, 'Escrow hold for Website copy that converts', '40000000-0000-4000-8000-000000000018', now() - interval '37 days'),
  ('60000000-0000-4000-8000-000000000042', '20000000-0000-4000-8000-000000000013', 'ESCROW_RELEASE', 1499900, 'Payment released for Website copy that converts', '40000000-0000-4000-8000-000000000018', now() - interval '31 days'),
  ('60000000-0000-4000-8000-000000000043', '20000000-0000-4000-8000-000000000004', 'ESCROW_HOLD', 1199900, 'Escrow hold for SEO content plan', '40000000-0000-4000-8000-000000000019', now() - interval '29 days'),
  ('60000000-0000-4000-8000-000000000044', '20000000-0000-4000-8000-000000000013', 'ESCROW_RELEASE', 1199900, 'Payment released for SEO content plan', '40000000-0000-4000-8000-000000000019', now() - interval '24 days'),
  ('60000000-0000-4000-8000-000000000045', '20000000-0000-4000-8000-000000000001', 'ESCROW_HOLD', 999900, 'Escrow hold for Founder story article', '40000000-0000-4000-8000-000000000020', now() - interval '25 days'),
  ('60000000-0000-4000-8000-000000000046', '20000000-0000-4000-8000-000000000013', 'ESCROW_RELEASE', 999900, 'Payment released for Founder story article', '40000000-0000-4000-8000-000000000020', now() - interval '18 days'),
  ('60000000-0000-4000-8000-000000000047', '20000000-0000-4000-8000-000000000002', 'ESCROW_HOLD', 799900, 'Escrow hold for Landing page microcopy that guides', '40000000-0000-4000-8000-000000000021', now() - interval '19 days'),
  ('60000000-0000-4000-8000-000000000048', '20000000-0000-4000-8000-000000000013', 'ESCROW_RELEASE', 799900, 'Payment released for Landing page microcopy that guides', '40000000-0000-4000-8000-000000000021', now() - interval '13 days'),
  ('60000000-0000-4000-8000-000000000049', '20000000-0000-4000-8000-000000000003', 'ESCROW_HOLD', 1499900, 'Escrow hold for API technical documentation', '40000000-0000-4000-8000-000000000022', now() - interval '15 days'),
  ('60000000-0000-4000-8000-000000000050', '20000000-0000-4000-8000-000000000013', 'ESCROW_RELEASE', 1499900, 'Payment released for API technical documentation', '40000000-0000-4000-8000-000000000022', now() - interval '8 days'),
  ('60000000-0000-4000-8000-000000000051', '20000000-0000-4000-8000-000000000004', 'ESCROW_HOLD', 599900, 'Escrow hold for Resume and LinkedIn writing', '40000000-0000-4000-8000-000000000023', now() - interval '8 days'),
  ('60000000-0000-4000-8000-000000000052', '20000000-0000-4000-8000-000000000013', 'ESCROW_RELEASE', 599900, 'Payment released for Resume and LinkedIn writing', '40000000-0000-4000-8000-000000000023', now() - interval '3 days'),
  ('60000000-0000-4000-8000-000000000053', '20000000-0000-4000-8000-000000000001', 'ESCROW_HOLD', 3299900, 'Escrow hold for Product launch motion pack', '40000000-0000-4000-8000-000000000024', now() - interval '38 days'),
  ('60000000-0000-4000-8000-000000000054', '20000000-0000-4000-8000-000000000014', 'ESCROW_RELEASE', 3299900, 'Payment released for Product launch motion pack', '40000000-0000-4000-8000-000000000024', now() - interval '29 days'),
  ('60000000-0000-4000-8000-000000000055', '20000000-0000-4000-8000-000000000002', 'ESCROW_HOLD', 3299900, 'Escrow hold for Product launch motion pack', '40000000-0000-4000-8000-000000000025', now() - interval '23 days'),
  ('60000000-0000-4000-8000-000000000056', '20000000-0000-4000-8000-000000000014', 'ESCROW_RELEASE', 3299900, 'Payment released for Product launch motion pack', '40000000-0000-4000-8000-000000000025', now() - interval '14 days'),
  ('60000000-0000-4000-8000-000000000057', '20000000-0000-4000-8000-000000000003', 'ESCROW_HOLD', 2499900, 'Escrow hold for Explainer video edit', '40000000-0000-4000-8000-000000000026', now() - interval '32 days'),
  ('60000000-0000-4000-8000-000000000058', '20000000-0000-4000-8000-000000000014', 'ESCROW_RELEASE', 2499900, 'Payment released for Explainer video edit', '40000000-0000-4000-8000-000000000026', now() - interval '21 days'),
  ('60000000-0000-4000-8000-000000000059', '20000000-0000-4000-8000-000000000004', 'ESCROW_HOLD', 1899900, 'Escrow hold for Logo animation and Lottie export', '40000000-0000-4000-8000-000000000027', now() - interval '15 days'),
  ('60000000-0000-4000-8000-000000000060', '20000000-0000-4000-8000-000000000014', 'ESCROW_RELEASE', 1899900, 'Payment released for Logo animation and Lottie export', '40000000-0000-4000-8000-000000000027', now() - interval '7 days'),
  ('60000000-0000-4000-8000-000000000061', '20000000-0000-4000-8000-000000000001', 'ESCROW_HOLD', 3499900, 'Escrow hold for Shopify store setup', '40000000-0000-4000-8000-000000000028', now() - interval '24 days'),
  ('60000000-0000-4000-8000-000000000062', '20000000-0000-4000-8000-000000000015', 'ESCROW_RELEASE', 3499900, 'Payment released for Shopify store setup', '40000000-0000-4000-8000-000000000028', now() - interval '13 days'),
  ('60000000-0000-4000-8000-000000000063', '20000000-0000-4000-8000-000000000002', 'ESCROW_HOLD', 3499900, 'Escrow hold for Shopify store setup', '40000000-0000-4000-8000-000000000029', now() - interval '15 days'),
  ('60000000-0000-4000-8000-000000000064', '20000000-0000-4000-8000-000000000015', 'ESCROW_RELEASE', 3499900, 'Payment released for Shopify store setup', '40000000-0000-4000-8000-000000000029', now() - interval '4 days'),
  ('60000000-0000-4000-8000-000000000065', '20000000-0000-4000-8000-000000000003', 'ESCROW_HOLD', 2799900, 'Escrow hold for Webflow marketing site', '40000000-0000-4000-8000-000000000030', now() - interval '20 days'),
  ('60000000-0000-4000-8000-000000000066', '20000000-0000-4000-8000-000000000015', 'ESCROW_RELEASE', 2799900, 'Payment released for Webflow marketing site', '40000000-0000-4000-8000-000000000030', now() - interval '11 days'),
  ('60000000-0000-4000-8000-000000000067', '20000000-0000-4000-8000-000000000004', 'ESCROW_HOLD', 2799900, 'Escrow hold for Webflow marketing site', '40000000-0000-4000-8000-000000000031', now() - interval '11 days'),
  ('60000000-0000-4000-8000-000000000068', '20000000-0000-4000-8000-000000000015', 'ESCROW_RELEASE', 2799900, 'Payment released for Webflow marketing site', '40000000-0000-4000-8000-000000000031', now() - interval '2 days'),
  ('60000000-0000-4000-8000-000000000069', '20000000-0000-4000-8000-000000000001', 'ESCROW_HOLD', 499900, 'Escrow hold for Podcast editing', '40000000-0000-4000-8000-000000000032', now() - interval '21 days'),
  ('60000000-0000-4000-8000-000000000070', '20000000-0000-4000-8000-000000000016', 'ESCROW_RELEASE', 499900, 'Payment released for Podcast editing', '40000000-0000-4000-8000-000000000032', now() - interval '17 days'),
  ('60000000-0000-4000-8000-000000000071', '20000000-0000-4000-8000-000000000002', 'ESCROW_HOLD', 1299900, 'Escrow hold for Short-form video pack (8 edits)', '40000000-0000-4000-8000-000000000033', now() - interval '16 days'),
  ('60000000-0000-4000-8000-000000000072', '20000000-0000-4000-8000-000000000016', 'ESCROW_RELEASE', 1299900, 'Payment released for Short-form video pack (8 edits)', '40000000-0000-4000-8000-000000000033', now() - interval '9 days'),
  ('60000000-0000-4000-8000-000000000073', '20000000-0000-4000-8000-000000000003', 'ESCROW_HOLD', 999900, 'Escrow hold for Product photo retouching (25 images)', '40000000-0000-4000-8000-000000000034', now() - interval '8 days'),
  ('60000000-0000-4000-8000-000000000074', '20000000-0000-4000-8000-000000000016', 'ESCROW_RELEASE', 999900, 'Payment released for Product photo retouching (25 images)', '40000000-0000-4000-8000-000000000034', now() - interval '3 days'),
  ('60000000-0000-4000-8000-000000000075', '20000000-0000-4000-8000-000000000004', 'ESCROW_HOLD', 1199900, 'Escrow hold for Email welcome sequence', '40000000-0000-4000-8000-000000000035', now() - interval '16 days'),
  ('60000000-0000-4000-8000-000000000076', '20000000-0000-4000-8000-000000000017', 'ESCROW_RELEASE', 1199900, 'Payment released for Email welcome sequence', '40000000-0000-4000-8000-000000000035', now() - interval '9 days'),
  ('60000000-0000-4000-8000-000000000077', '20000000-0000-4000-8000-000000000001', 'ESCROW_HOLD', 1799900, 'Escrow hold for Social growth sprint', '40000000-0000-4000-8000-000000000036', now() - interval '14 days'),
  ('60000000-0000-4000-8000-000000000078', '20000000-0000-4000-8000-000000000017', 'ESCROW_RELEASE', 1799900, 'Payment released for Social growth sprint', '40000000-0000-4000-8000-000000000036', now() - interval '3 days'),
  ('60000000-0000-4000-8000-000000000079', '20000000-0000-4000-8000-000000000002', 'ESCROW_HOLD', 2499900, 'Escrow hold for Supabase schema and row-level security', '40000000-0000-4000-8000-000000000037', now() - interval '10 days'),
  ('60000000-0000-4000-8000-000000000080', '20000000-0000-4000-8000-000000000018', 'ESCROW_RELEASE', 2499900, 'Payment released for Supabase schema and row-level security', '40000000-0000-4000-8000-000000000037', now() - interval '3 days'),
  ('60000000-0000-4000-8000-000000000081', '20000000-0000-4000-8000-000000000003', 'ESCROW_HOLD', 2999900, 'Escrow hold for BI dashboard build', '40000000-0000-4000-8000-000000000038', now() - interval '11 days'),
  ('60000000-0000-4000-8000-000000000082', '20000000-0000-4000-8000-000000000018', 'ESCROW_RELEASE', 2999900, 'Payment released for BI dashboard build', '40000000-0000-4000-8000-000000000038', now() - interval '1 day'),
  ('60000000-0000-4000-8000-000000000083', '20000000-0000-4000-8000-000000000001', 'ESCROW_HOLD', 599900, 'Escrow hold for Resume and LinkedIn writing', '40000000-0000-4000-8000-000000000039', now() - interval '20 days'),
  ('60000000-0000-4000-8000-000000000084', '20000000-0000-4000-8000-000000000001', 'ESCROW_REFUND', 599900, 'Refund for disputed Resume and LinkedIn writing', '40000000-0000-4000-8000-000000000039', now() - interval '4 days'),
  ('60000000-0000-4000-8000-000000000085', '20000000-0000-4000-8000-000000000003', 'DEPOSIT', 35000000, 'Initial demo wallet funding', NULL, now() - interval '74 days'),
  ('60000000-0000-4000-8000-000000000086', '20000000-0000-4000-8000-000000000004', 'DEPOSIT', 30000000, 'Initial demo wallet funding', NULL, now() - interval '59 days'),
  ('60000000-0000-4000-8000-000000000087', '20000000-0000-4000-8000-000000000011', 'WITHDRAWAL', 2500000, 'Demo earnings withdrawal', NULL, now() - interval '6 days'),
  ('60000000-0000-4000-8000-000000000088', '20000000-0000-4000-8000-000000000013', 'WITHDRAWAL', 2000000, 'Demo earnings withdrawal', NULL, now() - interval '5 days'),
  ('60000000-0000-4000-8000-000000000089', '20000000-0000-4000-8000-000000000015', 'WITHDRAWAL', 2000000, 'Demo earnings withdrawal', NULL, now() - interval '4 days'),
  ('60000000-0000-4000-8000-000000000090', '20000000-0000-4000-8000-000000000018', 'WITHDRAWAL', 1500000, 'Demo earnings withdrawal', NULL, now() - interval '2 days')
ON CONFLICT (id) DO UPDATE SET
  "walletId" = EXCLUDED."walletId",
  type = EXCLUDED.type,
  amount = EXCLUDED.amount,
  description = EXCLUDED.description,
  "orderId" = EXCLUDED."orderId",
  "createdAt" = EXCLUDED."createdAt";

INSERT INTO "Review" (id, "orderId", "serviceId", "reviewerId", "revieweeId", rating, comment, "createdAt") VALUES
  ('70000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000009', '30000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000011', 5, 'Maya gave us a calm, distinctive identity and explained every decision clearly. The handoff was excellent.', now() - interval '29 days'),
  ('70000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000010', '30000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000011', 4, 'Strong visual direction and a polished kit. We needed one extra round on the typography, which was handled quickly.', now() - interval '15 days'),
  ('70000000-0000-4000-8000-000000000005', '40000000-0000-4000-8000-000000000011', '30000000-0000-4000-8000-000000000014', '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000011', 5, 'The deck finally tells a coherent story. Maya turned a messy outline into something we were proud to present.', now() - interval '19 days'),
  ('70000000-0000-4000-8000-000000000006', '40000000-0000-4000-8000-000000000012', '30000000-0000-4000-8000-000000000027', '00000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000011', 5, 'A rigorous audit with practical fixes. The re-test gave our team real confidence in the accessibility work.', now() - interval '8 days'),
  ('70000000-0000-4000-8000-000000000007', '40000000-0000-4000-8000-000000000013', '30000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000012', 5, 'Noah shipped a fast, accessible landing page and kept us updated at every step. Exactly what we needed.', now() - interval '27 days'),
  ('70000000-0000-4000-8000-000000000008', '40000000-0000-4000-8000-000000000014', '30000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000012', 4, 'Great build quality and clear handoff notes. A small responsive issue was fixed the same day.', now() - interval '11 days'),
  ('70000000-0000-4000-8000-000000000009', '40000000-0000-4000-8000-000000000015', '30000000-0000-4000-8000-000000000013', '00000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000012', 5, 'The dashboard now answers the questions our team actually asks. Noah handled the data edge cases well.', now() - interval '22 days'),
  ('70000000-0000-4000-8000-000000000010', '40000000-0000-4000-8000-000000000016', '30000000-0000-4000-8000-000000000028', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000012', 5, 'Stripe billing worked in test mode on the first walkthrough. The documentation made launch straightforward.', now() - interval '14 days'),
  ('70000000-0000-4000-8000-000000000011', '40000000-0000-4000-8000-000000000017', '30000000-0000-4000-8000-000000000029', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000012', 5, 'The React Native MVP was ready for TestFlight on schedule. Clear structure and sensible trade-offs.', now() - interval '19 days'),
  ('70000000-0000-4000-8000-000000000012', '40000000-0000-4000-8000-000000000018', '30000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000013', 5, 'Zara found the one promise our homepage was missing. The rewrite is sharper and much easier to scan.', now() - interval '30 days'),
  ('70000000-0000-4000-8000-000000000013', '40000000-0000-4000-8000-000000000019', '30000000-0000-4000-8000-000000000007', '00000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000013', 5, 'A practical content plan we could start using immediately. The briefs were specific without being rigid.', now() - interval '23 days'),
  ('70000000-0000-4000-8000-000000000014', '40000000-0000-4000-8000-000000000020', '30000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000013', 4, 'The founder story sounds like us, not a press release. Zara was patient with our revisions.', now() - interval '17 days'),
  ('70000000-0000-4000-8000-000000000015', '40000000-0000-4000-8000-000000000021', '30000000-0000-4000-8000-000000000015', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000013', 5, 'Small copy changes made a big difference to the onboarding flow. Every screen now has a clear next step.', now() - interval '12 days'),
  ('70000000-0000-4000-8000-000000000016', '40000000-0000-4000-8000-000000000022', '30000000-0000-4000-8000-000000000025', '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000013', 4, 'The API docs are clean enough for new developers to follow without hand-holding. Good examples throughout.', now() - interval '7 days'),
  ('70000000-0000-4000-8000-000000000017', '40000000-0000-4000-8000-000000000023', '30000000-0000-4000-8000-000000000030', '00000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000013', 5, 'My resume and LinkedIn finally tell a consistent story. Zara was thoughtful about the roles I actually want.', now() - interval '2 days'),
  ('70000000-0000-4000-8000-000000000018', '40000000-0000-4000-8000-000000000024', '30000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000014', 5, 'The launch pack gave us exactly the energy we wanted. Leo delivered multiple formats without fuss.', now() - interval '28 days'),
  ('70000000-0000-4000-8000-000000000019', '40000000-0000-4000-8000-000000000025', '30000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000014', 4, 'Strong motion work and a smooth revision round. One export needed a tweak, resolved quickly.', now() - interval '13 days'),
  ('70000000-0000-4000-8000-000000000020', '40000000-0000-4000-8000-000000000026', '30000000-0000-4000-8000-000000000008', '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000014', 5, 'The explainer is concise and genuinely easy to follow. Captions and pacing were handled well.', now() - interval '20 days'),
  ('70000000-0000-4000-8000-000000000021', '40000000-0000-4000-8000-000000000027', '30000000-0000-4000-8000-000000000026', '00000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000014', 5, 'The logo animation feels premium and the Lottie export dropped straight into our product.', now() - interval '6 days'),
  ('70000000-0000-4000-8000-000000000022', '40000000-0000-4000-8000-000000000028', '30000000-0000-4000-8000-000000000016', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000015', 5, 'Tara set up the store end to end and caught issues before launch. The checklist was invaluable.', now() - interval '12 days'),
  ('70000000-0000-4000-8000-000000000023', '40000000-0000-4000-8000-000000000029', '30000000-0000-4000-8000-000000000016', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000015', 5, 'A clean Shopify build with sensible product structure. Payments and mobile layouts both worked first time.', now() - interval '3 days'),
  ('70000000-0000-4000-8000-000000000024', '40000000-0000-4000-8000-000000000030', '30000000-0000-4000-8000-000000000017', '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000015', 4, 'The Webflow site is easy for our team to edit. Tara''s training session made the handoff painless.', now() - interval '10 days'),
  ('70000000-0000-4000-8000-000000000025', '40000000-0000-4000-8000-000000000031', '30000000-0000-4000-8000-000000000017', '00000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000015', 5, 'Fast, polished, and well documented. We were publishing without needing developer support.', now() - interval '1 day'),
  ('70000000-0000-4000-8000-000000000026', '40000000-0000-4000-8000-000000000032', '30000000-0000-4000-8000-000000000018', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000016', 5, 'Kabir made a raw recording sound like a proper show. Chapters and show notes were a nice touch.', now() - interval '16 days'),
  ('70000000-0000-4000-8000-000000000027', '40000000-0000-4000-8000-000000000033', '30000000-0000-4000-8000-000000000019', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000016', 5, 'Eight strong edits with hooks that actually fit the platform. Turnaround was faster than promised.', now() - interval '8 days'),
  ('70000000-0000-4000-8000-000000000028', '40000000-0000-4000-8000-000000000034', '30000000-0000-4000-8000-000000000020', '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000016', 4, 'The retouching is consistent across the whole catalog. Colours look accurate and the shadows are natural.', now() - interval '2 days'),
  ('70000000-0000-4000-8000-000000000029', '40000000-0000-4000-8000-000000000035', '30000000-0000-4000-8000-000000000021', '00000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000017', 5, 'The welcome sequence sounds like our brand and flows logically. Ananya made the pricing change easy.', now() - interval '8 days'),
  ('70000000-0000-4000-8000-000000000030', '40000000-0000-4000-8000-000000000036', '30000000-0000-4000-8000-000000000022', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000017', 5, 'A focused sprint with posts we could publish immediately. The metric review gave us a clear next step.', now() - interval '2 days'),
  ('70000000-0000-4000-8000-000000000031', '40000000-0000-4000-8000-000000000037', '30000000-0000-4000-8000-000000000023', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000018', 5, 'The schema and row-level security policies are clean and well tested. The typed client example was a useful bonus.', now() - interval '2 days'),
  ('70000000-0000-4000-8000-000000000032', '40000000-0000-4000-8000-000000000038', '30000000-0000-4000-8000-000000000024', '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000018', 4, 'The dashboard is clear and the data model holds up under real queries. A solid, well-documented build.', now() - interval '6 hours')
ON CONFLICT ("orderId") DO UPDATE SET
  "serviceId" = EXCLUDED."serviceId",
  "reviewerId" = EXCLUDED."reviewerId",
  "revieweeId" = EXCLUDED."revieweeId",
  rating = EXCLUDED.rating,
  comment = EXCLUDED.comment,
  "createdAt" = EXCLUDED."createdAt";

INSERT INTO "Dispute" (id, "orderId", "clientId", reason, status, "adminNote", "resolvedAt", "createdAt") VALUES
  ('80000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000039', '00000000-0000-4000-8000-000000000001', 'The delivered draft omitted the senior-role positioning section and did not use the agreed experience examples.', 'RESOLVED_CLIENT', 'Reviewed the brief and delivery. The freelancer agreed the positioning section was missing; the order was refunded in full and the client confirmed resolution.', now() - interval '4 days', now() - interval '9 days')
ON CONFLICT ("orderId") DO UPDATE SET
  "clientId" = EXCLUDED."clientId",
  reason = EXCLUDED.reason,
  status = EXCLUDED.status,
  "adminNote" = EXCLUDED."adminNote",
  "resolvedAt" = EXCLUDED."resolvedAt",
  "createdAt" = EXCLUDED."createdAt";

INSERT INTO "Conversation" (id, "orderId", "createdAt") VALUES
  ('90000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000007', now() - interval '3 days'),
  ('90000000-0000-4000-8000-000000000005', '40000000-0000-4000-8000-000000000008', now() - interval '5 days'),
  ('90000000-0000-4000-8000-000000000006', '40000000-0000-4000-8000-000000000028', now() - interval '24 days'),
  ('90000000-0000-4000-8000-000000000007', '40000000-0000-4000-8000-000000000031', now() - interval '11 days'),
  ('90000000-0000-4000-8000-000000000008', '40000000-0000-4000-8000-000000000032', now() - interval '21 days'),
  ('90000000-0000-4000-8000-000000000009', '40000000-0000-4000-8000-000000000035', now() - interval '16 days'),
  ('90000000-0000-4000-8000-000000000010', '40000000-0000-4000-8000-000000000037', now() - interval '10 days'),
  ('90000000-0000-4000-8000-000000000011', '40000000-0000-4000-8000-000000000009', now() - interval '38 days'),
  ('90000000-0000-4000-8000-000000000012', '40000000-0000-4000-8000-000000000013', now() - interval '39 days'),
  ('90000000-0000-4000-8000-000000000013', '40000000-0000-4000-8000-000000000018', now() - interval '37 days')
ON CONFLICT ("orderId") DO UPDATE SET "createdAt" = EXCLUDED."createdAt";

INSERT INTO "Message" (id, "conversationId", "senderId", content, "createdAt") VALUES
  ('91000000-0000-4000-8000-000000000005', '90000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000002', 'Hi Leo, I''ve attached the launch brief and the two references we discussed.', now() - interval '3 days'),
  ('91000000-0000-4000-8000-000000000006', '90000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000014', 'Got it. I''ll start with the 15-second cut and share a first pass tomorrow.', now() - interval '2 days'),
  ('91000000-0000-4000-8000-000000000007', '90000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000002', 'The first pass looks good. Please keep the end card on screen a little longer.', now() - interval '1 day'),
  ('91000000-0000-4000-8000-000000000008', '90000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000014', 'Done — updated export is in the delivery note.', now() - interval '12 hours'),
  ('91000000-0000-4000-8000-000000000009', '90000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000001', 'I''ve added the keyword list and the pages we want to prioritise.', now() - interval '5 days'),
  ('91000000-0000-4000-8000-000000000010', '90000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000013', 'Thanks. I''ll map the first four weeks by intent and send a draft.', now() - interval '3 days'),
  ('91000000-0000-4000-8000-000000000011', '90000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000001', 'That structure works. Keep the briefs short enough for the team to action.', now() - interval '2 days'),
  ('91000000-0000-4000-8000-000000000012', '90000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000001', 'The product list and brand assets are in the shared folder.', now() - interval '24 days'),
  ('91000000-0000-4000-8000-000000000013', '90000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000015', 'I''ve set up the theme and payment flow. Reviewing the launch checklist now.', now() - interval '22 days'),
  ('91000000-0000-4000-8000-000000000014', '90000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000001', 'Payments look good. Please double-check the mobile product grid.', now() - interval '16 days'),
  ('91000000-0000-4000-8000-000000000015', '90000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000015', 'Fixed — the grid is consistent on all breakpoints now.', now() - interval '14 days'),
  ('91000000-0000-4000-8000-000000000016', '90000000-0000-4000-8000-000000000007', '00000000-0000-4000-8000-000000000004', 'We need the Webflow site live before the campaign on Friday.', now() - interval '11 days'),
  ('91000000-0000-4000-8000-000000000017', '90000000-0000-4000-8000-000000000007', '00000000-0000-4000-8000-000000000015', 'The CMS collections and SEO basics are ready. I''m doing the final editor pass.', now() - interval '9 days'),
  ('91000000-0000-4000-8000-000000000018', '90000000-0000-4000-8000-000000000007', '00000000-0000-4000-8000-000000000004', 'The editor walkthrough was clear. Let''s publish.', now() - interval '4 days'),
  ('91000000-0000-4000-8000-000000000019', '90000000-0000-4000-8000-000000000008', '00000000-0000-4000-8000-000000000001', 'The raw podcast files are uploaded. Please keep the pauses natural.', now() - interval '21 days'),
  ('91000000-0000-4000-8000-000000000020', '90000000-0000-4000-8000-000000000008', '00000000-0000-4000-8000-000000000016', 'Understood. I''ll clean the room noise and send a chaptered draft.', now() - interval '19 days'),
  ('91000000-0000-4000-8000-000000000021', '90000000-0000-4000-8000-000000000008', '00000000-0000-4000-8000-000000000001', 'The chapters are helpful. Please trim the intro by ten seconds.', now() - interval '18 days'),
  ('91000000-0000-4000-8000-000000000022', '90000000-0000-4000-8000-000000000009', '00000000-0000-4000-8000-000000000004', 'Can the welcome sequence reference the new pricing page?', now() - interval '16 days'),
  ('91000000-0000-4000-8000-000000000023', '90000000-0000-4000-8000-000000000009', '00000000-0000-4000-8000-000000000017', 'Yes — I''ll align the first three emails and keep the last two evergreen.', now() - interval '14 days'),
  ('91000000-0000-4000-8000-000000000024', '90000000-0000-4000-8000-000000000009', '00000000-0000-4000-8000-000000000004', 'Perfect. The tone is right.', now() - interval '12 days'),
  ('91000000-0000-4000-8000-000000000025', '90000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000002', 'We need row-level security for teams and individual accounts.', now() - interval '10 days'),
  ('91000000-0000-4000-8000-000000000026', '90000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000018', 'I''ve modelled the roles and policies. I''ll send the schema and seed data next.', now() - interval '8 days'),
  ('91000000-0000-4000-8000-000000000027', '90000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000002', 'The policy tests pass. Please add the typed client example.', now() - interval '5 days'),
  ('91000000-0000-4000-8000-000000000028', '90000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000001', 'I want the identity to feel calm and editorial, not corporate.', now() - interval '38 days'),
  ('91000000-0000-4000-8000-000000000029', '90000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000011', 'I''ll explore two type-led directions and a restrained colour palette.', now() - interval '36 days'),
  ('91000000-0000-4000-8000-000000000030', '90000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000001', 'The first direction is the right one. Please refine the wordmark.', now() - interval '32 days'),
  ('91000000-0000-4000-8000-000000000031', '90000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000002', 'The landing page needs to load fast on mid-range phones.', now() - interval '39 days'),
  ('91000000-0000-4000-8000-000000000032', '90000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000012', 'I''ll keep the hero light and lazy-load the testimonial media.', now() - interval '37 days'),
  ('91000000-0000-4000-8000-000000000033', '90000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000002', 'The mobile score looks good. Please hand off the content notes.', now() - interval '34 days'),
  ('91000000-0000-4000-8000-000000000034', '90000000-0000-4000-8000-000000000013', '00000000-0000-4000-8000-000000000003', 'The current homepage buries the main promise. Can you sharpen it?', now() - interval '37 days'),
  ('91000000-0000-4000-8000-000000000035', '90000000-0000-4000-8000-000000000013', '00000000-0000-4000-8000-000000000013', 'I''ll rewrite the hero, proof points, and closing CTA around one promise.', now() - interval '35 days'),
  ('91000000-0000-4000-8000-000000000036', '90000000-0000-4000-8000-000000000013', '00000000-0000-4000-8000-000000000003', 'Much clearer. Please keep the proof points specific.', now() - interval '33 days')
ON CONFLICT (id) DO UPDATE SET
  "conversationId" = EXCLUDED."conversationId",
  "senderId" = EXCLUDED."senderId",
  content = EXCLUDED.content,
  "createdAt" = EXCLUDED."createdAt";

INSERT INTO "Notification" (id, "userId", type, title, body, "orderId", "isRead", "createdAt") VALUES
  ('a0000000-0000-4000-8000-000000000009', '00000000-0000-4000-8000-000000000011', 'REVIEW_RECEIVED', 'New review received', 'You received a 5-star review for Brand identity starter kit.', '40000000-0000-4000-8000-000000000009', true, now() - interval '29 days'),
  ('a0000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000012', 'REVIEW_RECEIVED', 'New review received', 'You received a 5-star review for Next.js product landing page.', '40000000-0000-4000-8000-000000000013', true, now() - interval '27 days'),
  ('a0000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000013', 'REVIEW_RECEIVED', 'New review received', 'You received a 5-star review for Website copy that converts.', '40000000-0000-4000-8000-000000000018', true, now() - interval '30 days'),
  ('a0000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000014', 'REVIEW_RECEIVED', 'New review received', 'You received a 5-star review for Product launch motion pack.', '40000000-0000-4000-8000-000000000024', true, now() - interval '28 days'),
  ('a0000000-0000-4000-8000-000000000013', '00000000-0000-4000-8000-000000000015', 'REVIEW_RECEIVED', 'New review received', 'You received a 5-star review for Shopify store setup.', '40000000-0000-4000-8000-000000000028', false, now() - interval '12 days'),
  ('a0000000-0000-4000-8000-000000000014', '00000000-0000-4000-8000-000000000016', 'REVIEW_RECEIVED', 'New review received', 'You received a 5-star review for Podcast editing.', '40000000-0000-4000-8000-000000000032', false, now() - interval '16 days'),
  ('a0000000-0000-4000-8000-000000000015', '00000000-0000-4000-8000-000000000017', 'REVIEW_RECEIVED', 'New review received', 'You received a 5-star review for Email welcome sequence.', '40000000-0000-4000-8000-000000000035', false, now() - interval '8 days'),
  ('a0000000-0000-4000-8000-000000000016', '00000000-0000-4000-8000-000000000018', 'REVIEW_RECEIVED', 'New review received', 'You received a 5-star review for Supabase schema and row-level security.', '40000000-0000-4000-8000-000000000037', false, now() - interval '2 days'),
  ('a0000000-0000-4000-8000-000000000017', '00000000-0000-4000-8000-000000000001', 'ORDER_DELIVERED', 'Order delivered', 'Your SEO content plan is ready for review.', '40000000-0000-4000-8000-000000000008', false, now() - interval '1 day'),
  ('a0000000-0000-4000-8000-000000000018', '00000000-0000-4000-8000-000000000012', 'ORDER_COMPLETED', 'Order completed', 'Your order has been completed and payment has been released.', '40000000-0000-4000-8000-000000000014', true, now() - interval '12 days'),
  ('a0000000-0000-4000-8000-000000000019', '00000000-0000-4000-8000-000000000015', 'ORDER_COMPLETED', 'Order completed', 'Your order has been completed and payment has been released.', '40000000-0000-4000-8000-000000000031', false, now() - interval '2 days'),
  ('a0000000-0000-4000-8000-000000000020', '00000000-0000-4000-8000-000000000018', 'ORDER_COMPLETED', 'Order completed', 'Your order has been completed and payment has been released.', '40000000-0000-4000-8000-000000000038', false, now() - interval '1 day'),
  ('a0000000-0000-4000-8000-000000000021', '00000000-0000-4000-8000-000000000003', 'MESSAGE_RECEIVED', 'New message', 'Zara sent you a message about your website copy order.', '40000000-0000-4000-8000-000000000018', true, now() - interval '33 days'),
  ('a0000000-0000-4000-8000-000000000022', '00000000-0000-4000-8000-000000000004', 'MESSAGE_RECEIVED', 'New message', 'Tara sent you a message about your Webflow site order.', '40000000-0000-4000-8000-000000000031', false, now() - interval '4 days'),
  ('a0000000-0000-4000-8000-000000000023', '00000000-0000-4000-8000-000000000001', 'DISPUTE_RESOLVED', 'Dispute resolved', 'Your dispute was resolved in your favour and the escrow was refunded.', '40000000-0000-4000-8000-000000000039', false, now() - interval '4 days'),
  ('a0000000-0000-4000-8000-000000000024', '00000000-0000-4000-8000-000000000013', 'DISPUTE_RESOLVED', 'Dispute resolved', 'The dispute for the resume and LinkedIn order was resolved with a full client refund.', '40000000-0000-4000-8000-000000000039', true, now() - interval '4 days')
ON CONFLICT (id) DO UPDATE SET
  "userId" = EXCLUDED."userId",
  type = EXCLUDED.type,
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  "orderId" = EXCLUDED."orderId",
  "isRead" = EXCLUDED."isRead",
  "createdAt" = EXCLUDED."createdAt";

INSERT INTO "AuditLog" (id, "userId", "orderId", action, before, after, "createdAt") VALUES
  ('b0000000-0000-4000-8000-000000000007', '00000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000009', 'ORDER_STATUS_CHANGED', '{"status":null}', '{"status":"IN_PROGRESS"}', now() - interval '38 days'),
  ('b0000000-0000-4000-8000-000000000008', '00000000-0000-4000-8000-000000000011', '40000000-0000-4000-8000-000000000009', 'ORDER_STATUS_CHANGED', '{"status":"IN_PROGRESS"}', '{"status":"DELIVERED"}', now() - interval '31 days'),
  ('b0000000-0000-4000-8000-000000000009', '00000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000009', 'ORDER_STATUS_CHANGED', '{"status":"DELIVERED"}', '{"status":"COMPLETED"}', now() - interval '30 days'),
  ('b0000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000010', 'ORDER_STATUS_CHANGED', '{"status":null}', '{"status":"IN_PROGRESS"}', now() - interval '24 days'),
  ('b0000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000011', '40000000-0000-4000-8000-000000000010', 'ORDER_STATUS_CHANGED', '{"status":"IN_PROGRESS"}', '{"status":"DELIVERED"}', now() - interval '17 days'),
  ('b0000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000010', 'ORDER_STATUS_CHANGED', '{"status":"DELIVERED"}', '{"status":"COMPLETED"}', now() - interval '16 days'),
  ('b0000000-0000-4000-8000-000000000013', '00000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000011', 'ORDER_STATUS_CHANGED', '{"status":null}', '{"status":"IN_PROGRESS"}', now() - interval '29 days'),
  ('b0000000-0000-4000-8000-000000000014', '00000000-0000-4000-8000-000000000011', '40000000-0000-4000-8000-000000000011', 'ORDER_STATUS_CHANGED', '{"status":"IN_PROGRESS"}', '{"status":"DELIVERED"}', now() - interval '21 days'),
  ('b0000000-0000-4000-8000-000000000015', '00000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000011', 'ORDER_STATUS_CHANGED', '{"status":"DELIVERED"}', '{"status":"COMPLETED"}', now() - interval '20 days'),
  ('b0000000-0000-4000-8000-000000000016', '00000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000012', 'ORDER_STATUS_CHANGED', '{"status":null}', '{"status":"IN_PROGRESS"}', now() - interval '16 days'),
  ('b0000000-0000-4000-8000-000000000017', '00000000-0000-4000-8000-000000000011', '40000000-0000-4000-8000-000000000012', 'ORDER_STATUS_CHANGED', '{"status":"IN_PROGRESS"}', '{"status":"DELIVERED"}', now() - interval '10 days'),
  ('b0000000-0000-4000-8000-000000000018', '00000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000012', 'ORDER_STATUS_CHANGED', '{"status":"DELIVERED"}', '{"status":"COMPLETED"}', now() - interval '9 days'),
  ('b0000000-0000-4000-8000-000000000019', '00000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000013', 'ORDER_STATUS_CHANGED', '{"status":null}', '{"status":"IN_PROGRESS"}', now() - interval '39 days'),
  ('b0000000-0000-4000-8000-000000000020', '00000000-0000-4000-8000-000000000012', '40000000-0000-4000-8000-000000000013', 'ORDER_STATUS_CHANGED', '{"status":"IN_PROGRESS"}', '{"status":"DELIVERED"}', now() - interval '29 days'),
  ('b0000000-0000-4000-8000-000000000021', '00000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000013', 'ORDER_STATUS_CHANGED', '{"status":"DELIVERED"}', '{"status":"COMPLETED"}', now() - interval '28 days'),
  ('b0000000-0000-4000-8000-000000000022', '00000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000014', 'ORDER_STATUS_CHANGED', '{"status":null}', '{"status":"IN_PROGRESS"}', now() - interval '23 days'),
  ('b0000000-0000-4000-8000-000000000023', '00000000-0000-4000-8000-000000000012', '40000000-0000-4000-8000-000000000014', 'ORDER_STATUS_CHANGED', '{"status":"IN_PROGRESS"}', '{"status":"DELIVERED"}', now() - interval '13 days'),
  ('b0000000-0000-4000-8000-000000000024', '00000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000014', 'ORDER_STATUS_CHANGED', '{"status":"DELIVERED"}', '{"status":"COMPLETED"}', now() - interval '12 days'),
  ('b0000000-0000-4000-8000-000000000025', '00000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000015', 'ORDER_STATUS_CHANGED', '{"status":null}', '{"status":"IN_PROGRESS"}', now() - interval '38 days'),
  ('b0000000-0000-4000-8000-000000000026', '00000000-0000-4000-8000-000000000012', '40000000-0000-4000-8000-000000000015', 'ORDER_STATUS_CHANGED', '{"status":"IN_PROGRESS"}', '{"status":"DELIVERED"}', now() - interval '24 days'),
  ('b0000000-0000-4000-8000-000000000027', '00000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000015', 'ORDER_STATUS_CHANGED', '{"status":"DELIVERED"}', '{"status":"COMPLETED"}', now() - interval '23 days'),
  ('b0000000-0000-4000-8000-000000000028', '00000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000016', 'ORDER_STATUS_CHANGED', '{"status":null}', '{"status":"IN_PROGRESS"}', now() - interval '26 days'),
  ('b0000000-0000-4000-8000-000000000029', '00000000-0000-4000-8000-000000000012', '40000000-0000-4000-8000-000000000016', 'ORDER_STATUS_CHANGED', '{"status":"IN_PROGRESS"}', '{"status":"DELIVERED"}', now() - interval '16 days'),
  ('b0000000-0000-4000-8000-000000000030', '00000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000016', 'ORDER_STATUS_CHANGED', '{"status":"DELIVERED"}', '{"status":"COMPLETED"}', now() - interval '15 days'),
  ('b0000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000017', 'ORDER_STATUS_CHANGED', '{"status":null}', '{"status":"IN_PROGRESS"}', now() - interval '35 days'),
  ('b0000000-0000-4000-8000-000000000032', '00000000-0000-4000-8000-000000000012', '40000000-0000-4000-8000-000000000017', 'ORDER_STATUS_CHANGED', '{"status":"IN_PROGRESS"}', '{"status":"DELIVERED"}', now() - interval '21 days'),
  ('b0000000-0000-4000-8000-000000000033', '00000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000017', 'ORDER_STATUS_CHANGED', '{"status":"DELIVERED"}', '{"status":"COMPLETED"}', now() - interval '20 days'),
  ('b0000000-0000-4000-8000-000000000034', '00000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000018', 'ORDER_STATUS_CHANGED', '{"status":null}', '{"status":"IN_PROGRESS"}', now() - interval '37 days'),
  ('b0000000-0000-4000-8000-000000000035', '00000000-0000-4000-8000-000000000013', '40000000-0000-4000-8000-000000000018', 'ORDER_STATUS_CHANGED', '{"status":"IN_PROGRESS"}', '{"status":"DELIVERED"}', now() - interval '32 days'),
  ('b0000000-0000-4000-8000-000000000036', '00000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000018', 'ORDER_STATUS_CHANGED', '{"status":"DELIVERED"}', '{"status":"COMPLETED"}', now() - interval '31 days'),
  ('b0000000-0000-4000-8000-000000000037', '00000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000019', 'ORDER_STATUS_CHANGED', '{"status":null}', '{"status":"IN_PROGRESS"}', now() - interval '29 days'),
  ('b0000000-0000-4000-8000-000000000038', '00000000-0000-4000-8000-000000000013', '40000000-0000-4000-8000-000000000019', 'ORDER_STATUS_CHANGED', '{"status":"IN_PROGRESS"}', '{"status":"DELIVERED"}', now() - interval '25 days'),
  ('b0000000-0000-4000-8000-000000000039', '00000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000019', 'ORDER_STATUS_CHANGED', '{"status":"DELIVERED"}', '{"status":"COMPLETED"}', now() - interval '24 days'),
  ('b0000000-0000-4000-8000-000000000040', '00000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000020', 'ORDER_STATUS_CHANGED', '{"status":null}', '{"status":"IN_PROGRESS"}', now() - interval '25 days'),
  ('b0000000-0000-4000-8000-000000000041', '00000000-0000-4000-8000-000000000013', '40000000-0000-4000-8000-000000000020', 'ORDER_STATUS_CHANGED', '{"status":"IN_PROGRESS"}', '{"status":"DELIVERED"}', now() - interval '19 days'),
  ('b0000000-0000-4000-8000-000000000042', '00000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000020', 'ORDER_STATUS_CHANGED', '{"status":"DELIVERED"}', '{"status":"COMPLETED"}', now() - interval '18 days'),
  ('b0000000-0000-4000-8000-000000000043', '00000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000021', 'ORDER_STATUS_CHANGED', '{"status":null}', '{"status":"IN_PROGRESS"}', now() - interval '19 days'),
  ('b0000000-0000-4000-8000-000000000044', '00000000-0000-4000-8000-000000000013', '40000000-0000-4000-8000-000000000021', 'ORDER_STATUS_CHANGED', '{"status":"IN_PROGRESS"}', '{"status":"DELIVERED"}', now() - interval '14 days'),
  ('b0000000-0000-4000-8000-000000000045', '00000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000021', 'ORDER_STATUS_CHANGED', '{"status":"DELIVERED"}', '{"status":"COMPLETED"}', now() - interval '13 days'),
  ('b0000000-0000-4000-8000-000000000046', '00000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000022', 'ORDER_STATUS_CHANGED', '{"status":null}', '{"status":"IN_PROGRESS"}', now() - interval '15 days'),
  ('b0000000-0000-4000-8000-000000000047', '00000000-0000-4000-8000-000000000013', '40000000-0000-4000-8000-000000000022', 'ORDER_STATUS_CHANGED', '{"status":"IN_PROGRESS"}', '{"status":"DELIVERED"}', now() - interval '9 days'),
  ('b0000000-0000-4000-8000-000000000048', '00000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000022', 'ORDER_STATUS_CHANGED', '{"status":"DELIVERED"}', '{"status":"COMPLETED"}', now() - interval '8 days'),
  ('b0000000-0000-4000-8000-000000000049', '00000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000023', 'ORDER_STATUS_CHANGED', '{"status":null}', '{"status":"IN_PROGRESS"}', now() - interval '8 days'),
  ('b0000000-0000-4000-8000-000000000050', '00000000-0000-4000-8000-000000000013', '40000000-0000-4000-8000-000000000023', 'ORDER_STATUS_CHANGED', '{"status":"IN_PROGRESS"}', '{"status":"DELIVERED"}', now() - interval '4 days'),
  ('b0000000-0000-4000-8000-000000000051', '00000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000023', 'ORDER_STATUS_CHANGED', '{"status":"DELIVERED"}', '{"status":"COMPLETED"}', now() - interval '3 days'),
  ('b0000000-0000-4000-8000-000000000052', '00000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000024', 'ORDER_STATUS_CHANGED', '{"status":null}', '{"status":"IN_PROGRESS"}', now() - interval '38 days'),
  ('b0000000-0000-4000-8000-000000000053', '00000000-0000-4000-8000-000000000014', '40000000-0000-4000-8000-000000000024', 'ORDER_STATUS_CHANGED', '{"status":"IN_PROGRESS"}', '{"status":"DELIVERED"}', now() - interval '30 days'),
  ('b0000000-0000-4000-8000-000000000054', '00000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000024', 'ORDER_STATUS_CHANGED', '{"status":"DELIVERED"}', '{"status":"COMPLETED"}', now() - interval '29 days'),
  ('b0000000-0000-4000-8000-000000000055', '00000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000025', 'ORDER_STATUS_CHANGED', '{"status":null}', '{"status":"IN_PROGRESS"}', now() - interval '23 days'),
  ('b0000000-0000-4000-8000-000000000056', '00000000-0000-4000-8000-000000000014', '40000000-0000-4000-8000-000000000025', 'ORDER_STATUS_CHANGED', '{"status":"IN_PROGRESS"}', '{"status":"DELIVERED"}', now() - interval '15 days'),
  ('b0000000-0000-4000-8000-000000000057', '00000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000025', 'ORDER_STATUS_CHANGED', '{"status":"DELIVERED"}', '{"status":"COMPLETED"}', now() - interval '14 days'),
  ('b0000000-0000-4000-8000-000000000058', '00000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000026', 'ORDER_STATUS_CHANGED', '{"status":null}', '{"status":"IN_PROGRESS"}', now() - interval '32 days'),
  ('b0000000-0000-4000-8000-000000000059', '00000000-0000-4000-8000-000000000014', '40000000-0000-4000-8000-000000000026', 'ORDER_STATUS_CHANGED', '{"status":"IN_PROGRESS"}', '{"status":"DELIVERED"}', now() - interval '22 days'),
  ('b0000000-0000-4000-8000-000000000060', '00000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000026', 'ORDER_STATUS_CHANGED', '{"status":"DELIVERED"}', '{"status":"COMPLETED"}', now() - interval '21 days'),
  ('b0000000-0000-4000-8000-000000000061', '00000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000027', 'ORDER_STATUS_CHANGED', '{"status":null}', '{"status":"IN_PROGRESS"}', now() - interval '15 days'),
  ('b0000000-0000-4000-8000-000000000062', '00000000-0000-4000-8000-000000000014', '40000000-0000-4000-8000-000000000027', 'ORDER_STATUS_CHANGED', '{"status":"IN_PROGRESS"}', '{"status":"DELIVERED"}', now() - interval '8 days'),
  ('b0000000-0000-4000-8000-000000000063', '00000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000027', 'ORDER_STATUS_CHANGED', '{"status":"DELIVERED"}', '{"status":"COMPLETED"}', now() - interval '7 days'),
  ('b0000000-0000-4000-8000-000000000064', '00000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000028', 'ORDER_STATUS_CHANGED', '{"status":null}', '{"status":"IN_PROGRESS"}', now() - interval '24 days'),
  ('b0000000-0000-4000-8000-000000000065', '00000000-0000-4000-8000-000000000015', '40000000-0000-4000-8000-000000000028', 'ORDER_STATUS_CHANGED', '{"status":"IN_PROGRESS"}', '{"status":"DELIVERED"}', now() - interval '14 days'),
  ('b0000000-0000-4000-8000-000000000066', '00000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000028', 'ORDER_STATUS_CHANGED', '{"status":"DELIVERED"}', '{"status":"COMPLETED"}', now() - interval '13 days'),
  ('b0000000-0000-4000-8000-000000000067', '00000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000029', 'ORDER_STATUS_CHANGED', '{"status":null}', '{"status":"IN_PROGRESS"}', now() - interval '15 days'),
  ('b0000000-0000-4000-8000-000000000068', '00000000-0000-4000-8000-000000000015', '40000000-0000-4000-8000-000000000029', 'ORDER_STATUS_CHANGED', '{"status":"IN_PROGRESS"}', '{"status":"DELIVERED"}', now() - interval '5 days'),
  ('b0000000-0000-4000-8000-000000000069', '00000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000029', 'ORDER_STATUS_CHANGED', '{"status":"DELIVERED"}', '{"status":"COMPLETED"}', now() - interval '4 days'),
  ('b0000000-0000-4000-8000-000000000070', '00000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000030', 'ORDER_STATUS_CHANGED', '{"status":null}', '{"status":"IN_PROGRESS"}', now() - interval '20 days'),
  ('b0000000-0000-4000-8000-000000000071', '00000000-0000-4000-8000-000000000015', '40000000-0000-4000-8000-000000000030', 'ORDER_STATUS_CHANGED', '{"status":"IN_PROGRESS"}', '{"status":"DELIVERED"}', now() - interval '12 days'),
  ('b0000000-0000-4000-8000-000000000072', '00000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000030', 'ORDER_STATUS_CHANGED', '{"status":"DELIVERED"}', '{"status":"COMPLETED"}', now() - interval '11 days'),
  ('b0000000-0000-4000-8000-000000000073', '00000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000031', 'ORDER_STATUS_CHANGED', '{"status":null}', '{"status":"IN_PROGRESS"}', now() - interval '11 days'),
  ('b0000000-0000-4000-8000-000000000074', '00000000-0000-4000-8000-000000000015', '40000000-0000-4000-8000-000000000031', 'ORDER_STATUS_CHANGED', '{"status":"IN_PROGRESS"}', '{"status":"DELIVERED"}', now() - interval '3 days'),
  ('b0000000-0000-4000-8000-000000000075', '00000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000031', 'ORDER_STATUS_CHANGED', '{"status":"DELIVERED"}', '{"status":"COMPLETED"}', now() - interval '2 days'),
  ('b0000000-0000-4000-8000-000000000076', '00000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000032', 'ORDER_STATUS_CHANGED', '{"status":null}', '{"status":"IN_PROGRESS"}', now() - interval '21 days'),
  ('b0000000-0000-4000-8000-000000000077', '00000000-0000-4000-8000-000000000016', '40000000-0000-4000-8000-000000000032', 'ORDER_STATUS_CHANGED', '{"status":"IN_PROGRESS"}', '{"status":"DELIVERED"}', now() - interval '18 days'),
  ('b0000000-0000-4000-8000-000000000078', '00000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000032', 'ORDER_STATUS_CHANGED', '{"status":"DELIVERED"}', '{"status":"COMPLETED"}', now() - interval '17 days'),
  ('b0000000-0000-4000-8000-000000000079', '00000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000033', 'ORDER_STATUS_CHANGED', '{"status":null}', '{"status":"IN_PROGRESS"}', now() - interval '16 days'),
  ('b0000000-0000-4000-8000-000000000080', '00000000-0000-4000-8000-000000000016', '40000000-0000-4000-8000-000000000033', 'ORDER_STATUS_CHANGED', '{"status":"IN_PROGRESS"}', '{"status":"DELIVERED"}', now() - interval '10 days'),
  ('b0000000-0000-4000-8000-000000000081', '00000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000033', 'ORDER_STATUS_CHANGED', '{"status":"DELIVERED"}', '{"status":"COMPLETED"}', now() - interval '9 days'),
  ('b0000000-0000-4000-8000-000000000082', '00000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000034', 'ORDER_STATUS_CHANGED', '{"status":null}', '{"status":"IN_PROGRESS"}', now() - interval '8 days'),
  ('b0000000-0000-4000-8000-000000000083', '00000000-0000-4000-8000-000000000016', '40000000-0000-4000-8000-000000000034', 'ORDER_STATUS_CHANGED', '{"status":"IN_PROGRESS"}', '{"status":"DELIVERED"}', now() - interval '4 days'),
  ('b0000000-0000-4000-8000-000000000084', '00000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000034', 'ORDER_STATUS_CHANGED', '{"status":"DELIVERED"}', '{"status":"COMPLETED"}', now() - interval '3 days'),
  ('b0000000-0000-4000-8000-000000000085', '00000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000035', 'ORDER_STATUS_CHANGED', '{"status":null}', '{"status":"IN_PROGRESS"}', now() - interval '16 days'),
  ('b0000000-0000-4000-8000-000000000086', '00000000-0000-4000-8000-000000000017', '40000000-0000-4000-8000-000000000035', 'ORDER_STATUS_CHANGED', '{"status":"IN_PROGRESS"}', '{"status":"DELIVERED"}', now() - interval '10 days'),
  ('b0000000-0000-4000-8000-000000000087', '00000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000035', 'ORDER_STATUS_CHANGED', '{"status":"DELIVERED"}', '{"status":"COMPLETED"}', now() - interval '9 days'),
  ('b0000000-0000-4000-8000-000000000088', '00000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000036', 'ORDER_STATUS_CHANGED', '{"status":null}', '{"status":"IN_PROGRESS"}', now() - interval '14 days'),
  ('b0000000-0000-4000-8000-000000000089', '00000000-0000-4000-8000-000000000017', '40000000-0000-4000-8000-000000000036', 'ORDER_STATUS_CHANGED', '{"status":"IN_PROGRESS"}', '{"status":"DELIVERED"}', now() - interval '4 days'),
  ('b0000000-0000-4000-8000-000000000090', '00000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000036', 'ORDER_STATUS_CHANGED', '{"status":"DELIVERED"}', '{"status":"COMPLETED"}', now() - interval '3 days'),
  ('b0000000-0000-4000-8000-000000000091', '00000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000037', 'ORDER_STATUS_CHANGED', '{"status":null}', '{"status":"IN_PROGRESS"}', now() - interval '10 days'),
  ('b0000000-0000-4000-8000-000000000092', '00000000-0000-4000-8000-000000000018', '40000000-0000-4000-8000-000000000037', 'ORDER_STATUS_CHANGED', '{"status":"IN_PROGRESS"}', '{"status":"DELIVERED"}', now() - interval '4 days'),
  ('b0000000-0000-4000-8000-000000000093', '00000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000037', 'ORDER_STATUS_CHANGED', '{"status":"DELIVERED"}', '{"status":"COMPLETED"}', now() - interval '3 days'),
  ('b0000000-0000-4000-8000-000000000094', '00000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000038', 'ORDER_STATUS_CHANGED', '{"status":null}', '{"status":"IN_PROGRESS"}', now() - interval '11 days'),
  ('b0000000-0000-4000-8000-000000000095', '00000000-0000-4000-8000-000000000018', '40000000-0000-4000-8000-000000000038', 'ORDER_STATUS_CHANGED', '{"status":"IN_PROGRESS"}', '{"status":"DELIVERED"}', now() - interval '2 days'),
  ('b0000000-0000-4000-8000-000000000096', '00000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000038', 'ORDER_STATUS_CHANGED', '{"status":"DELIVERED"}', '{"status":"COMPLETED"}', now() - interval '1 day'),
  ('b0000000-0000-4000-8000-000000000097', '00000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000039', 'ORDER_STATUS_CHANGED', '{"status":null}', '{"status":"IN_PROGRESS"}', now() - interval '20 days'),
  ('b0000000-0000-4000-8000-000000000098', '00000000-0000-4000-8000-000000000013', '40000000-0000-4000-8000-000000000039', 'ORDER_STATUS_CHANGED', '{"status":"IN_PROGRESS"}', '{"status":"DELIVERED"}', now() - interval '12 days'),
  ('b0000000-0000-4000-8000-000000000099', '00000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000039', 'DISPUTE_OPENED', '{"orderStatus":"DELIVERED"}', '{"orderStatus":"DISPUTED"}', now() - interval '9 days'),
  ('b0000000-0000-4000-8000-000000000100', '00000000-0000-4000-8000-000000000099', '40000000-0000-4000-8000-000000000039', 'ORDER_STATUS_CHANGED', '{"status":"DISPUTED"}', '{"status":"REFUNDED"}', now() - interval '4 days'),
  ('b0000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000099', '40000000-0000-4000-8000-000000000039', 'DISPUTE_RESOLVED', '{"status":"OPEN"}', '{"status":"RESOLVED_CLIENT"}', now() - interval '4 days')
ON CONFLICT (id) DO UPDATE SET
  "userId" = EXCLUDED."userId",
  "orderId" = EXCLUDED."orderId",
  action = EXCLUDED.action,
  before = EXCLUDED.before,
  after = EXCLUDED.after,
  "createdAt" = EXCLUDED."createdAt";

-- Derive demo reputation and balances from the seeded ledger
UPDATE "Profile" p
SET rating = COALESCE(agg.rating, 0),
    "totalReviews" = COALESCE(agg."totalReviews", 0),
    "updatedAt" = now()
FROM (
  SELECT u.id AS user_id,
         AVG(r.rating)::float AS rating,
         COUNT(r.id)::int AS "totalReviews"
  FROM "User" u
  LEFT JOIN "Review" r ON r."revieweeId" = u.id
  WHERE u.email LIKE '%@skillshift.demo'
  GROUP BY u.id
) agg
WHERE p."userId" = agg.user_id;

UPDATE "Wallet" w
SET balance = COALESCE((
  SELECT SUM(CASE t.type
    WHEN 'DEPOSIT' THEN t.amount
    WHEN 'ESCROW_RELEASE' THEN t.amount
    WHEN 'ESCROW_REFUND' THEN t.amount
    WHEN 'ESCROW_HOLD' THEN -t.amount
    WHEN 'WITHDRAWAL' THEN -t.amount
  END)
  FROM "Transaction" t
  WHERE t."walletId" = w.id
), 0),
  "updatedAt" = now()
WHERE w."userId" IN (SELECT id FROM "User" WHERE email LIKE '%@skillshift.demo');

SELECT 'users' AS table_name, count(*) AS demo_count FROM "User" WHERE email LIKE '%@skillshift.demo'
UNION ALL SELECT 'services', count(*) FROM "Service" WHERE id LIKE '30000000-%'
UNION ALL SELECT 'active_services', count(*) FROM "Service" WHERE id LIKE '30000000-%' AND status = 'ACTIVE'
UNION ALL SELECT 'pending_services', count(*) FROM "Service" WHERE id LIKE '30000000-%' AND status = 'PENDING_REVIEW'
UNION ALL SELECT 'orders', count(*) FROM "Order" WHERE id LIKE '40000000-%'
UNION ALL SELECT 'completed_orders', count(*) FROM "Order" WHERE id LIKE '40000000-%' AND status = 'COMPLETED'
UNION ALL SELECT 'wallets', count(*) FROM "Wallet" WHERE id LIKE '20000000-%'
UNION ALL SELECT 'escrows', count(*) FROM "Escrow" WHERE id LIKE '50000000-%'
UNION ALL SELECT 'transactions', count(*) FROM "Transaction" WHERE id LIKE '60000000-%'
UNION ALL SELECT 'reviews', count(*) FROM "Review" WHERE id LIKE '70000000-%'
UNION ALL SELECT 'disputes', count(*) FROM "Dispute" WHERE id LIKE '80000000-%'
UNION ALL SELECT 'conversations', count(*) FROM "Conversation" WHERE id LIKE '90000000-%'
UNION ALL SELECT 'messages', count(*) FROM "Message" WHERE id LIKE '91000000-%'
UNION ALL SELECT 'notifications', count(*) FROM "Notification" WHERE id LIKE 'a0000000-%'
UNION ALL SELECT 'audit_logs', count(*) FROM "AuditLog" WHERE id LIKE 'b0000000-%'
ORDER BY table_name;

ALTER TABLE "User" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "Profile" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "Wallet" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "Service" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "updatedAt" DROP DEFAULT;
