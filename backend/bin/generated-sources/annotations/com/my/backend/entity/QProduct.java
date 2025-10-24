package com.my.backend.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QProduct is a Querydsl query type for Product
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QProduct extends EntityPathBase<Product> {

    private static final long serialVersionUID = 187422899L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QProduct product = new QProduct("product");

    public final NumberPath<Long> amount = createNumber("amount", Long.class);

    public final DateTimePath<java.time.LocalDateTime> auctionEndTime = createDateTime("auctionEndTime", java.time.LocalDateTime.class);

    public final QBid bid;

    public final QCategory category;

    public final StringPath content = createString("content");

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final StringPath imageUrl = createString("imageUrl");

    public final BooleanPath oneMinuteAuction = createBoolean("oneMinuteAuction");

    public final QPayment payment;

    public final EnumPath<Payment.PaymentStatus> paymentStatus = createEnum("paymentStatus", Payment.PaymentStatus.class);

    public final NumberPath<Long> paymentUserId = createNumber("paymentUserId", Long.class);

    public final NumberPath<Long> productId = createNumber("productId", Long.class);

    public final EnumPath<Product.ProductStatus> productStatus = createEnum("productStatus", Product.ProductStatus.class);

    public final NumberPath<Long> startingPrice = createNumber("startingPrice", Long.class);

    public final StringPath title = createString("title");

    public final DateTimePath<java.time.LocalDateTime> updatedAt = createDateTime("updatedAt", java.time.LocalDateTime.class);

    public final QUser user;

    public QProduct(String variable) {
        this(Product.class, forVariable(variable), INITS);
    }

    public QProduct(Path<? extends Product> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QProduct(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QProduct(PathMetadata metadata, PathInits inits) {
        this(Product.class, metadata, inits);
    }

    public QProduct(Class<? extends Product> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.bid = inits.isInitialized("bid") ? new QBid(forProperty("bid"), inits.get("bid")) : null;
        this.category = inits.isInitialized("category") ? new QCategory(forProperty("category")) : null;
        this.payment = inits.isInitialized("payment") ? new QPayment(forProperty("payment"), inits.get("payment")) : null;
        this.user = inits.isInitialized("user") ? new QUser(forProperty("user")) : null;
    }

}

