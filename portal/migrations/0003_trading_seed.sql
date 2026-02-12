-- 0003_trading_seed.sql — Seed products and listings

-- Products
INSERT INTO products (id, type, name_zh, name_en, description_zh, description_en, icon, display_order, status, created_at, updated_at)
VALUES
  ('prod_rbo', 'RBO', '收益分享憑證', 'Revenue-Based Obligations',
   '投資人持有收益分享憑證，定期獲得企業營收或利潤之特定比例分配。投資門檻親民，適合追求穩定現金流的投資人。',
   'Investors hold revenue-sharing certificates and receive periodic distributions based on a specified percentage of company revenue or profit. Accessible thresholds for investors seeking stable cash flow.',
   'currency', 1, 'active', '2025-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z'),

  ('prod_spv', 'SPV', '特殊目的機構', 'Special Purpose Vehicle',
   '透過特殊目的機構投資特定項目或資產組合，資產隔離保護，分散風險並獲得穩定回報。',
   'Invest in specific projects or asset portfolios through special purpose vehicles, with asset isolation protection, risk diversification, and stable returns.',
   'building', 2, 'active', '2025-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z'),

  ('prod_spac', 'SPAC', '特殊目的收購', 'Special Purpose Acquisition',
   '參與特殊目的收購公司，由專業團隊選標，共同發掘並投資具有潛力的中小企業標的。投資人享有表決權與明確退出機制。',
   'Participate in special purpose acquisition companies with professional team selection, discovering and investing in promising SME targets. Investors enjoy voting rights and clear exit mechanisms.',
   'lightning', 3, 'active', '2025-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z');

-- Listings — RBO (5)
INSERT INTO listings (id, product_id, product_type, symbol, name_zh, name_en, description_zh, description_en, unit_price, total_units, available_units, yield_rate, risk_level, status, listed_at, created_at, updated_at)
VALUES
  ('lst_rbo_001', 'prod_rbo', 'RBO', 'RBO-DFT', '大豐茶業收益憑證', 'Da Feng Tea Revenue Bond',
   '大豐茶業為南投知名茶葉品牌，主打高山烏龍茶外銷日本市場。', 'Da Feng Tea is a renowned Nantou tea brand specializing in high-mountain oolong tea exported to Japan.',
   '10000', '5000', '3200', '6.5', 'low', 'active', '2025-06-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z'),

  ('lst_rbo_002', 'prod_rbo', 'RBO', 'RBO-HMF', '宏美食品收益憑證', 'Hong Mei Foods Revenue Bond',
   '宏美食品專營冷凍水產加工，為全台前十大水產出口商。', 'Hong Mei Foods specializes in frozen seafood processing, ranking among Taiwan''s top 10 seafood exporters.',
   '5000', '10000', '7500', '7.2', 'low', 'active', '2025-06-15T00:00:00.000Z', '2025-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z'),

  ('lst_rbo_003', 'prod_rbo', 'RBO', 'RBO-JCE', '捷誠能源收益憑證', 'Jie Cheng Energy Revenue Bond',
   '捷誠能源為屏東太陽能系統整合商，年營收穩定成長。', 'Jie Cheng Energy is a Pingtung solar system integrator with stable annual revenue growth.',
   '8000', '8000', '5600', '5.8', 'medium', 'active', '2025-07-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z'),

  ('lst_rbo_004', 'prod_rbo', 'RBO', 'RBO-YSB', '元盛生技收益憑證', 'Yuan Sheng Biotech Revenue Bond',
   '元盛生技從事保健食品研發製造，產品銷售至東南亞五國。', 'Yuan Sheng Biotech develops and manufactures health supplements, with products sold across five Southeast Asian countries.',
   '15000', '4000', '2800', '8.1', 'medium', 'active', '2025-07-15T00:00:00.000Z', '2025-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z'),

  ('lst_rbo_005', 'prod_rbo', 'RBO', 'RBO-TML', '泰茂物流收益憑證', 'Tai Mao Logistics Revenue Bond',
   '泰茂物流為北台灣冷鏈物流龍頭，服務各大超商與量販通路。', 'Tai Mao Logistics is the leading cold chain logistics provider in northern Taiwan, serving major convenience stores and retail channels.',
   '20000', '3000', '1500', '5.2', 'low', 'active', '2025-08-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z');

-- Listings — SPV (5)
INSERT INTO listings (id, product_id, product_type, symbol, name_zh, name_en, description_zh, description_en, unit_price, total_units, available_units, yield_rate, risk_level, status, listed_at, created_at, updated_at)
VALUES
  ('lst_spv_001', 'prod_spv', 'SPV', 'SPV-GRP', '綠能園區開發基金', 'Green Park Development Fund',
   '投資台南科技園區綠能設施建設，租金收入穩定回報。', 'Investment in green energy facility construction at Tainan Science Park, with stable rental income returns.',
   '50000', '2000', '1400', '4.8', 'medium', 'active', '2025-06-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z'),

  ('lst_spv_002', 'prod_spv', 'SPV', 'SPV-SCH', '新竹學舍收益基金', 'Hsinchu Student Housing Fund',
   '投資新竹科學園區周邊學生宿舍開發案，穩定租金收入。', 'Investment in student housing development near Hsinchu Science Park, with stable rental income.',
   '30000', '5000', '3500', '5.5', 'low', 'active', '2025-06-15T00:00:00.000Z', '2025-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z'),

  ('lst_spv_003', 'prod_spv', 'SPV', 'SPV-EVM', '電動車材料基金', 'EV Materials Fund',
   '投資電動車電池材料供應鏈，涵蓋正極材料與電解液製造。', 'Investment in EV battery material supply chain, covering cathode materials and electrolyte manufacturing.',
   '100000', '1000', '600', '9.2', 'high', 'active', '2025-07-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z'),

  ('lst_spv_004', 'prod_spv', 'SPV', 'SPV-AGT', '智慧農業科技基金', 'AgriTech Innovation Fund',
   '投資台灣智慧農業技術新創，涵蓋精準農業與農產品溯源。', 'Investment in Taiwan''s smart agriculture technology startups, covering precision farming and produce traceability.',
   '25000', '4000', '3200', '6.8', 'medium', 'active', '2025-07-15T00:00:00.000Z', '2025-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z'),

  ('lst_spv_005', 'prod_spv', 'SPV', 'SPV-MED', '醫療器材創新基金', 'MedTech Innovation Fund',
   '投資台灣醫療器材新創公司，聚焦微創手術與遠距醫療設備。', 'Investment in Taiwan''s medical device startups, focusing on minimally invasive surgery and telemedicine equipment.',
   '80000', '1500', '900', '7.5', 'high', 'active', '2025-08-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z');

-- Listings — SPAC (5)
INSERT INTO listings (id, product_id, product_type, symbol, name_zh, name_en, description_zh, description_en, unit_price, total_units, available_units, yield_rate, risk_level, status, listed_at, created_at, updated_at)
VALUES
  ('lst_spac_001', 'prod_spac', 'SPAC', 'SPAC-AIX', 'AI 應用收購公司', 'AI Applications Acquisition Corp',
   '由資深科技業高管團隊主導，目標收購具 AI 應用潛力之中小企業。', 'Led by a senior technology executive team, targeting SME acquisitions with AI application potential.',
   '50000', '3000', '2100', '12.0', 'high', 'active', '2025-06-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z'),

  ('lst_spac_002', 'prod_spac', 'SPAC', 'SPAC-GFT', '綠色食品科技收購', 'Green FoodTech Acquisition Corp',
   '聚焦食品科技領域，尋找植物基蛋白與食品加工創新企業。', 'Focusing on food technology, seeking plant-based protein and food processing innovation companies.',
   '30000', '5000', '4000', '10.5', 'high', 'active', '2025-06-15T00:00:00.000Z', '2025-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z'),

  ('lst_spac_003', 'prod_spac', 'SPAC', 'SPAC-CYB', '資安科技收購公司', 'CyberTech Acquisition Corp',
   '專注資訊安全產業，目標收購具有獨特技術之台灣資安新創。', 'Focused on the cybersecurity industry, targeting Taiwan cybersecurity startups with unique technologies.',
   '40000', '2500', '1800', '11.0', 'high', 'active', '2025-07-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z'),

  ('lst_spac_004', 'prod_spac', 'SPAC', 'SPAC-ESG', 'ESG 永續收購公司', 'ESG Sustainability Acquisition Corp',
   '以 ESG 為核心策略，收購具永續發展潛力之中小企業。', 'With ESG as the core strategy, acquiring SMEs with sustainable development potential.',
   '25000', '6000', '4800', '8.5', 'medium', 'active', '2025-07-15T00:00:00.000Z', '2025-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z'),

  ('lst_spac_005', 'prod_spac', 'SPAC', 'SPAC-SEM', '半導體設備收購公司', 'Semiconductor Equipment Acquisition Corp',
   '由半導體產業資深團隊主導，目標收購半導體設備與材料供應商。', 'Led by a senior semiconductor industry team, targeting semiconductor equipment and materials suppliers.',
   '100000', '1500', '900', '13.5', 'high', 'active', '2025-08-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z');
