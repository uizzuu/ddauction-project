package com.my.backend.service.board;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.IntStream;

@Service
//전체 페이지와 현재 페이지를주면
//페이징 블럭을 전달해 주는 서비스
public class PaginationService {
    private static final int BAR_LENGTH = 5;
    public List<Integer> getPaginationBarNumber(
            int currentPageNumber,
            int totalPageNumber
    ){
        int startNumber =
                Math.max(currentPageNumber - (BAR_LENGTH / 2), 0);
        int endNumber =
                Math.min(startNumber + BAR_LENGTH, totalPageNumber);
//        endNumber 보다 1 작은 값 까지
        return IntStream.range(startNumber, endNumber)
                .boxed().toList();
    }

    public int currentBarLenght() {
        return BAR_LENGTH;
    }

}
