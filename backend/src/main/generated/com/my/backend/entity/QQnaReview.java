package com.my.backend.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QQnaReview is a Querydsl query type for QnaReview
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QQnaReview extends EntityPathBase<QnaReview> {

    private static final long serialVersionUID = -533673696L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QQnaReview qnaReview = new QQnaReview("qnaReview");

    public final StringPath answer = createString("answer");

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final QQna qna;

    public final NumberPath<Long> qnaReviewId = createNumber("qnaReviewId", Long.class);

    public final QUser qnaUser;

    public final DateTimePath<java.time.LocalDateTime> updatedAt = createDateTime("updatedAt", java.time.LocalDateTime.class);

    public QQnaReview(String variable) {
        this(QnaReview.class, forVariable(variable), INITS);
    }

    public QQnaReview(Path<? extends QnaReview> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QQnaReview(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QQnaReview(PathMetadata metadata, PathInits inits) {
        this(QnaReview.class, metadata, inits);
    }

    public QQnaReview(Class<? extends QnaReview> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.qna = inits.isInitialized("qna") ? new QQna(forProperty("qna"), inits.get("qna")) : null;
        this.qnaUser = inits.isInitialized("qnaUser") ? new QUser(forProperty("qnaUser")) : null;
    }

}

