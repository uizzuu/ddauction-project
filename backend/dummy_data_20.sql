-- 1. Users Setup (Seller & Buyer)
-- Seller Credentials: ID=seller@generic.com / PW=Password123!
INSERT INTO users (created_at, updated_at, email, password, nick_name, user_name, phone, role) VALUES (NOW(), NOW(), 'seller@generic.com', '$2a$10$2X5SwSNb8AHN47/1aD3GoucrZ.6XiGN2w9qepb9Noe4uFFGGaKD0C', 'SellerUser', 'SellerName', '010-1111-2222', 'USER') ON DUPLICATE KEY UPDATE user_name='SellerName', nick_name='SellerUser', password='$2a$10$2X5SwSNb8AHN47/1aD3GoucrZ.6XiGN2w9qepb9Noe4uFFGGaKD0C';
-- Buyer Credentials: ID=buyer@test.com / PW=Password123!
INSERT INTO users (created_at, updated_at, email, password, nick_name, user_name, phone, role) VALUES (NOW(), NOW(), 'buyer@test.com', '$2a$10$2X5SwSNb8AHN47/1aD3GoucrZ.6XiGN2w9qepb9Noe4uFFGGaKD0C', 'BuyerUser', 'BuyerName', '010-3333-4444', 'USER') ON DUPLICATE KEY UPDATE user_name='BuyerName', nick_name='BuyerUser', password='$2a$10$2X5SwSNb8AHN47/1aD3GoucrZ.6XiGN2w9qepb9Noe4uFFGGaKD0C';
DELETE FROM users WHERE email='wuju@example.com';

-- 2. Get User IDs
SET @seller_user_id = (SELECT user_id FROM users WHERE email = 'seller@generic.com' LIMIT 1);
SET @buyer_user_id = (SELECT user_id FROM users WHERE email = 'buyer@test.com' LIMIT 1);
-- Fallback for safety
SET @seller_user_id = IFNULL(@seller_user_id, 1);
SET @buyer_user_id = IFNULL(@buyer_user_id, 2);

-- === Batch: Seller(S) -> Buyer(B) ===
-- Item 1 (STORE / KITCHENWARE)
INSERT INTO product (title, content, starting_price, sale_price, view_count, created_at, updated_at, product_type, product_status, product_category_type, seller_id, tag, delivery_included) VALUES ('Dummy KITCHENWARE 1', 'Fantastic KITCHENWARE item number 1', 22000, 22000, 69, NOW(), NOW(), 'STORE', 'SOLD', 'KITCHENWARE', @seller_user_id, 'tag_Seller(S) -> Buyer(B)_1_3224', false);
SET @curr_prod_id = LAST_INSERT_ID();
INSERT INTO payment (total_price, created_at, updated_at, payment_method_type, payment_status, product_type, product_id, user_id, courier_name, tracking_number) VALUES (22000, NOW(), NOW(), 'CARD', 'CONFIRMED', 'STORE', @curr_prod_id, @buyer_user_id, 'POST', 'TRK-1-9242');
SET @curr_pay_id = LAST_INSERT_ID();
UPDATE product SET payment_id = @curr_pay_id WHERE product_id = @curr_prod_id;

-- === Batch: Buyer(S) -> Seller(B) ===
-- Item 11 (USED / FURNITURE_INTERIOR)
INSERT INTO product (title, content, starting_price, sale_price, view_count, created_at, updated_at, product_type, product_status, product_category_type, seller_id, tag, delivery_included) VALUES ('Dummy FURNITURE_INTERIOR 11', 'Fantastic FURNITURE_INTERIOR item number 11', 113000, 113000, 97, NOW(), NOW(), 'USED', 'SOLD', 'FURNITURE_INTERIOR', @buyer_user_id, 'tag_Buyer(S) -> Seller(B)_11_9166', false);
SET @curr_prod_id = LAST_INSERT_ID();
INSERT INTO payment (total_price, created_at, updated_at, payment_method_type, payment_status, product_type, product_id, user_id, courier_name, tracking_number) VALUES (113000, NOW(), NOW(), 'CARD', 'CONFIRMED', 'USED', @curr_prod_id, @seller_user_id, 'POST', 'TRK-11-9374');
SET @curr_pay_id = LAST_INSERT_ID();
UPDATE product SET payment_id = @curr_pay_id WHERE product_id = @curr_prod_id;

