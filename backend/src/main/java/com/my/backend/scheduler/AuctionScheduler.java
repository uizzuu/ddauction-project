package com.my.backend.scheduler;

import com.my.backend.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuctionScheduler {

    private final ProductService productService;

    @Scheduled(fixedRate = 60000)
    public void updateAuctionStatus() {
        productService.closeExpiredAuctions();
    }
}
