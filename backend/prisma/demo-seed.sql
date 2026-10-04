-- SkillShift local demo data. Safe to rerun: all rows use deterministic IDs and upserts.
-- Demo password for every account: Demo1234!

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
  ('00000000-0000-4000-8000-000000000099', 'admin@skillshift.demo', '$2b$10$O5YiAncLBt9waOxaUsX9fertdAOsiZGqD36fukQSJpD9KdxEyiSYe', 'ADMIN', true, now())
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = EXCLUDED.role, "isEmailVerified" = true;

INSERT INTO "Profile" (id, "userId", "displayName", bio, skills, "portfolioUrls", rating, "totalReviews") VALUES
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'Aarav Client', 'Product builder looking for thoughtful collaborators.', ARRAY['product','startups'], ARRAY[]::text[], 0, 0),
  ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002', 'Diya Client', 'Independent founder with a growing studio.', ARRAY['branding','content'], ARRAY[]::text[], 0, 0),
  ('10000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000011', 'Maya Rao', 'Brand designer turning complex ideas into clear visual systems.', ARRAY['branding','figma','illustration'], ARRAY['portfolio/maya-branding']::text[], 4.8, 12),
  ('10000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000012', 'Noah Shah', 'Full-stack developer focused on fast, dependable product launches.', ARRAY['react','nextjs','typescript'], ARRAY['portfolio/noah-products']::text[], 4.9, 18),
  ('10000000-0000-4000-8000-000000000013', '00000000-0000-4000-8000-000000000013', 'Zara Mehta', 'Copywriter and content strategist for ambitious teams.', ARRAY['copywriting','seo','content'], ARRAY['portfolio/zara-copy']::text[], 4.7, 9),
  ('10000000-0000-4000-8000-000000000014', '00000000-0000-4000-8000-000000000014', 'Leo Fernandes', 'Motion designer making product stories feel alive.', ARRAY['motion','video','after-effects'], ARRAY['portfolio/leo-motion']::text[], 4.6, 7),
  ('10000000-0000-4000-8000-000000000099', '00000000-0000-4000-8000-000000000099', 'SkillShift Admin', 'Marketplace operations.', ARRAY['operations'], ARRAY[]::text[], 0, 0)
ON CONFLICT ("userId") DO UPDATE SET "displayName" = EXCLUDED."displayName", bio = EXCLUDED.bio, skills = EXCLUDED.skills, rating = EXCLUDED.rating, "totalReviews" = EXCLUDED."totalReviews";

INSERT INTO "Wallet" (id, "userId", balance) VALUES
  ('20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 18400),
  ('20000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002', 9200),
  ('20000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000011', 28600),
  ('20000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000012', 41200),
  ('20000000-0000-4000-8000-000000000013', '00000000-0000-4000-8000-000000000013', 19700),
  ('20000000-0000-4000-8000-000000000014', '00000000-0000-4000-8000-000000000014', 15300),
  ('20000000-0000-4000-8000-000000000099', '00000000-0000-4000-8000-000000000099', 0)
ON CONFLICT ("userId") DO UPDATE SET balance = EXCLUDED.balance;

INSERT INTO "Service" (id, "freelancerId", title, description, price, "deliveryDays", skills, "imageUrls", status) VALUES
  ('30000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000011', 'Brand identity starter kit', 'A focused logo, colour palette, typography pair, and handoff guide for a new product.', 8500, 7, ARRAY['branding','figma','logo'], ARRAY[]::text[], 'ACTIVE'),
  ('30000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000012', 'Next.js product landing page', 'A responsive, accessible landing page built with Next.js and a clean content structure.', 18000, 10, ARRAY['react','nextjs','typescript'], ARRAY[]::text[], 'ACTIVE'),
  ('30000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000013', 'Website copy that converts', 'Homepage and product messaging rewritten around one clear customer promise.', 6500, 5, ARRAY['copywriting','content','seo'], ARRAY[]::text[], 'ACTIVE'),
  ('30000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000014', 'Product launch motion pack', 'Three short motion assets for a launch page, social post, or product demo.', 12000, 8, ARRAY['motion','video','after-effects'], ARRAY[]::text[], 'ACTIVE'),
  ('30000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000011', 'Figma mobile app screens', 'A polished six-screen mobile flow with components and developer-ready specs.', 14000, 9, ARRAY['figma','ui','mobile'], ARRAY[]::text[], 'ACTIVE'),
  ('30000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000012', 'API integration sprint', 'Connect a frontend to a REST API with loading, error, and empty states.', 22000, 12, ARRAY['react','node','api'], ARRAY[]::text[], 'ACTIVE'),
  ('30000000-0000-4000-8000-000000000007', '00000000-0000-4000-8000-000000000013', 'SEO content plan', 'A practical 30-day content plan with search intent, briefs, and publishing priorities.', 5000, 4, ARRAY['seo','content','research'], ARRAY[]::text[], 'ACTIVE'),
  ('30000000-0000-4000-8000-000000000008', '00000000-0000-4000-8000-000000000014', 'Explainer video edit', 'A concise product explainer edit with captions, pacing, and delivery-ready exports.', 16000, 10, ARRAY['video','editing','motion'], ARRAY[]::text[], 'ACTIVE'),
  ('30000000-0000-4000-8000-000000000009', '00000000-0000-4000-8000-000000000011', 'Design system audit', 'A practical audit of tokens, components, and interaction consistency.', 9500, 6, ARRAY['design-system','figma','ux'], ARRAY[]::text[], 'PENDING_REVIEW'),
  ('30000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000012', 'React performance review', 'A focused review of rendering, data loading, and bundle opportunities.', 11000, 5, ARRAY['react','performance','typescript'], ARRAY[]::text[], 'PAUSED'),
  ('30000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000013', 'Founder story article', 'A warm, edited founder story for a launch, press page, or investor update.', 7200, 6, ARRAY['writing','editing','storytelling'], ARRAY[]::text[], 'ACTIVE'),
  ('30000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000014', 'Social launch templates', 'A reusable set of launch graphics and motion-ready social templates.', 8800, 7, ARRAY['design','social','motion'], ARRAY[]::text[], 'REJECTED')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, price = EXCLUDED.price, "deliveryDays" = EXCLUDED."deliveryDays", skills = EXCLUDED.skills, status = EXCLUDED.status, "deletedAt" = NULL;

INSERT INTO "Order" (id, "clientId", "freelancerId", "serviceId", status, price, "deliveryDays", requirements, "deliveryNote", "autoCompleteAt") VALUES
  ('40000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000011', '30000000-0000-4000-8000-000000000001', 'IN_PROGRESS', 8500, 7, 'Need a calm, editorial identity for a climate analytics product.', NULL, NULL),
  ('40000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000012', '30000000-0000-4000-8000-000000000002', 'DELIVERED', 18000, 10, 'Please use the attached product notes and keep the page fast on mobile.', 'The responsive landing page and handoff notes are ready for review.', now() + interval '5 days'),
  ('40000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000011', '30000000-0000-4000-8000-000000000005', 'COMPLETED', 14000, 9, 'Design a simple onboarding flow for a habit app.', 'Final Figma file and component notes delivered.', NULL),
  ('40000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000013', '30000000-0000-4000-8000-000000000003', 'DISPUTED', 6500, 5, 'Rewrite the homepage with a sharper enterprise message.', 'First draft delivered, but several requested sections are missing.', NULL),
  ('40000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000014', '30000000-0000-4000-8000-000000000004', 'CANCELLED', 12000, 8, 'Create a product launch animation for the new release.', NULL, NULL),
  ('40000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000012', '30000000-0000-4000-8000-000000000006', 'COMPLETED', 22000, 12, 'Connect the checkout flow to the existing API.', 'Integration shipped with error and loading states.', NULL),
  ('40000000-0000-4000-8000-000000000007', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000014', '30000000-0000-4000-8000-000000000008', 'IN_PROGRESS', 16000, 10, 'Edit a concise explainer for our product launch.', NULL, NULL),
  ('40000000-0000-4000-8000-000000000008', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000013', '30000000-0000-4000-8000-000000000007', 'DELIVERED', 5000, 4, 'Build a four-week SEO plan for a new marketplace.', 'The plan, keywords, and first briefs are ready.', now() + interval '6 days')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, requirements = EXCLUDED.requirements, "deliveryNote" = EXCLUDED."deliveryNote", "autoCompleteAt" = EXCLUDED."autoCompleteAt";

INSERT INTO "Escrow" (id, "orderId", amount, status, "releasedAt", "refundedAt") VALUES
  ('50000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 8500, 'HOLDING', NULL, NULL),
  ('50000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000002', 18000, 'HOLDING', NULL, NULL),
  ('50000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000003', 14000, 'RELEASED', now() - interval '8 days', NULL),
  ('50000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000004', 6500, 'HOLDING', NULL, NULL),
  ('50000000-0000-4000-8000-000000000005', '40000000-0000-4000-8000-000000000005', 12000, 'REFUNDED', NULL, now() - interval '12 days'),
  ('50000000-0000-4000-8000-000000000006', '40000000-0000-4000-8000-000000000006', 22000, 'RELEASED', now() - interval '20 days', NULL),
  ('50000000-0000-4000-8000-000000000007', '40000000-0000-4000-8000-000000000007', 16000, 'HOLDING', NULL, NULL),
  ('50000000-0000-4000-8000-000000000008', '40000000-0000-4000-8000-000000000008', 5000, 'HOLDING', NULL, NULL)
ON CONFLICT ("orderId") DO UPDATE SET amount = EXCLUDED.amount, status = EXCLUDED.status, "releasedAt" = EXCLUDED."releasedAt", "refundedAt" = EXCLUDED."refundedAt";

INSERT INTO "Transaction" (id, "walletId", type, amount, description, "orderId") VALUES
  ('60000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'DEPOSIT', 50000, 'Initial demo wallet funding', NULL),
  ('60000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'ESCROW_HOLD', 8500, 'Escrow hold for order 40000000', '40000000-0000-4000-8000-000000000001'),
  ('60000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001', 'ESCROW_HOLD', 18000, 'Escrow hold for order 40000000', '40000000-0000-4000-8000-000000000002'),
  ('60000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000001', 'ESCROW_REFUND', 12000, 'Refund for cancelled order', '40000000-0000-4000-8000-000000000005'),
  ('60000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000002', 'DEPOSIT', 40000, 'Initial demo wallet funding', NULL),
  ('60000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000011', 'ESCROW_RELEASE', 14000, 'Payment received for completed order', '40000000-0000-4000-8000-000000000003'),
  ('60000000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000012', 'ESCROW_RELEASE', 22000, 'Payment received for completed order', '40000000-0000-4000-8000-000000000006'),
  ('60000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000012', 'WITHDRAWAL', 5000, 'Demo earnings withdrawal', NULL),
  ('60000000-0000-4000-8000-000000000009', '20000000-0000-4000-8000-000000000013', 'DEPOSIT', 25000, 'Demo earnings balance', NULL),
  ('60000000-0000-4000-8000-000000000010', '20000000-0000-4000-8000-000000000014', 'DEPOSIT', 20000, 'Demo earnings balance', NULL)
ON CONFLICT (id) DO NOTHING;

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
UNION ALL SELECT 'transactions', count(*) FROM "Transaction" WHERE id LIKE '60000000-%'
UNION ALL SELECT 'notifications', count(*) FROM "Notification" WHERE id LIKE 'a0000000-%';

ALTER TABLE "User" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "Profile" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "Wallet" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "Service" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "updatedAt" DROP DEFAULT;
