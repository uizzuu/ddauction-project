
import random

def generate_sql():
    sql = []
    
    # 1. Create/Update Users (UPSERT)
    # SellerUser
    # Email: seller@generic.com / PW: Password123!
    sql.append("-- 1. Users Setup (Seller & Buyer)")
    sql.append("-- Seller Credentials: ID=seller@generic.com / PW=Password123!")
    sql.append("INSERT INTO users (created_at, updated_at, email, password, nick_name, user_name, phone, role) "
               "VALUES (NOW(), NOW(), 'seller@generic.com', '$2a$10$2X5SwSNb8AHN47/1aD3GoucrZ.6XiGN2w9qepb9Noe4uFFGGaKD0C', 'SellerUser', 'SellerName', '010-1111-2222', 'USER') "
               "ON DUPLICATE KEY UPDATE user_name='SellerName', nick_name='SellerUser', password='$2a$10$2X5SwSNb8AHN47/1aD3GoucrZ.6XiGN2w9qepb9Noe4uFFGGaKD0C';")

    # BuyerUser
    # Email: buyer@test.com / PW: Password123!
    sql.append("-- Buyer Credentials: ID=buyer@test.com / PW=Password123!")
    sql.append("INSERT INTO users (created_at, updated_at, email, password, nick_name, user_name, phone, role) "
               "VALUES (NOW(), NOW(), 'buyer@test.com', '$2a$10$2X5SwSNb8AHN47/1aD3GoucrZ.6XiGN2w9qepb9Noe4uFFGGaKD0C', 'BuyerUser', 'BuyerName', '010-3333-4444', 'USER') "
               "ON DUPLICATE KEY UPDATE user_name='BuyerName', nick_name='BuyerUser', password='$2a$10$2X5SwSNb8AHN47/1aD3GoucrZ.6XiGN2w9qepb9Noe4uFFGGaKD0C';")
    
    # Remove old 'wuju' if it exists differently (optional cleanup)
    sql.append("DELETE FROM users WHERE email='wuju@example.com';")
    sql.append("")
    
    # 2. Variable Setup
    sql.append("-- 2. Get User IDs")
    sql.append("SET @seller_user_id = (SELECT user_id FROM users WHERE email = 'seller@generic.com' LIMIT 1);")
    sql.append("SET @buyer_user_id = (SELECT user_id FROM users WHERE email = 'buyer@test.com' LIMIT 1);")
    sql.append("-- Fallback for safety")
    sql.append("SET @seller_user_id = IFNULL(@seller_user_id, 1);")
    sql.append("SET @buyer_user_id = IFNULL(@buyer_user_id, 2);")
    sql.append("")

    categories = [
        'ELECTRONICS', 'APPLIANCES', 'FURNITURE_INTERIOR', 'KITCHENWARE', 
        'CLOTHING', 'ACCESSORIES', 'BEAUTY', 'SPORTS', 'ENTERTAINMENT'
    ]
    types = ['USED', 'STORE'] # Keep it simple, avoiding complex Auction-Bid logic for now
    statuses = ['PAID', 'CONFIRMED']

    # Function to generate a block of sales
    def generate_batch(seller_var, buyer_var, batch_name, count_range):
        sql.append(f"-- === Batch: {batch_name} ===")
        for i in range(count_range[0], count_range[1]):
            price = random.randint(10, 500) * 1000
            cat = random.choice(categories)
            ptype = random.choice(types)
            status = random.choice(statuses)
            
            # 3. Create Product
            sql.append(f"-- Item {i} ({ptype} / {cat})")
            sql.append(f"INSERT INTO product (title, content, starting_price, sale_price, view_count, created_at, updated_at, product_type, product_status, product_category_type, seller_id, tag, delivery_included) VALUES ('Dummy {cat} {i}', 'Fantastic {cat} item number {i}', {price}, {price}, {random.randint(0,100)}, NOW(), NOW(), '{ptype}', 'SOLD', '{cat}', {seller_var}, 'tag_{batch_name}_{i}_{random.randint(1000,9999)}', false);")
            sql.append("SET @curr_prod_id = LAST_INSERT_ID();")
            
            # 4. Create Payment
            sql.append(f"INSERT INTO payment (total_price, created_at, updated_at, payment_method_type, payment_status, product_type, product_id, user_id, courier_name, tracking_number) VALUES ({price}, NOW(), NOW(), 'CARD', '{status}', '{ptype}', @curr_prod_id, {buyer_var}, 'POST', 'TRK-{i}-{random.randint(1000,9999)}');")
            sql.append("SET @curr_pay_id = LAST_INSERT_ID();")
            
            # 5. Link Product -> Payment
            sql.append("UPDATE product SET payment_id = @curr_pay_id WHERE product_id = @curr_prod_id;")
            sql.append("")

    # Generate 10 sales: SellerUser sells -> BuyerUser buys
    # This gives BuyerUser "Buying History" and SellerUser "Selling History"
    generate_batch("@seller_user_id", "@buyer_user_id", "Seller(S) -> Buyer(B)", range(1, 11))

    # Generate 10 sales: BuyerUser sells -> SellerUser buys
    # This gives BuyerUser "Selling History" and SellerUser "Buying History"
    generate_batch("@buyer_user_id", "@seller_user_id", "Buyer(S) -> Seller(B)", range(11, 21))

    return "\n".join(sql)

if __name__ == "__main__":
    print(generate_sql())
