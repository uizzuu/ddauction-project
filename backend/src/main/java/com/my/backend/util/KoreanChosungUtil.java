package com.my.backend.util;

/**
 * 한글 초성 검색 유틸리티
 * 
 * 예시:
 * - "ㄴㅌ" 입력 → "니트", "나트륨" 매칭
 * - "ㅂㄹㄹ" 입력 → "블랙", "블루" 매칭
 */
public class KoreanChosungUtil {

    // 한글 초성 배열 (ㄱ~ㅎ)
    private static final char[] CHOSUNG = {
        'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ',
        'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
    };

    /**
     * 한글 문자에서 초성 추출
     * 
     * @param ch 한글 문자 (예: '니')
     * @return 초성 (예: 'ㄴ'), 한글이 아니면 원본 문자 반환
     */
    public static char getChosung(char ch) {
        // 한글 유니코드 범위: '가'(0xAC00) ~ '힣'(0xD7A3)
        if (ch >= 0xAC00 && ch <= 0xD7A3) {
            int unicode = ch - 0xAC00;
            int chosungIndex = unicode / (21 * 28); // 21개 중성 * 28개 종성
            return CHOSUNG[chosungIndex];
        }
        // 한글이 아니면 원본 반환 (영어, 숫자 등)
        return ch;
    }

    /**
     * 문자열에서 초성만 추출
     * 
     * @param text 원본 문자열 (예: "니트")
     * @return 초성 문자열 (예: "ㄴㅌ")
     */
    public static String extractChosung(String text) {
        if (text == null || text.isEmpty()) {
            return "";
        }

        StringBuilder chosung = new StringBuilder();
        for (char ch : text.toCharArray()) {
            chosung.append(getChosung(ch));
        }
        return chosung.toString();
    }

    /**
     * 초성 검색 매칭 여부 확인
     * 
     * @param text 검색 대상 문자열 (예: "니트 원피스")
     * @param chosungQuery 초성 검색어 (예: "ㄴㅌ")
     * @return 매칭 여부
     * 
     * 예시:
     * - matchesChosung("니트", "ㄴㅌ") → true
     * - matchesChosung("블랙 니트", "ㄴㅌ") → true (부분 매칭)
     * - matchesChosung("원피스", "ㄴㅌ") → false
     */
    public static boolean matchesChosung(String text, String chosungQuery) {
        if (text == null || chosungQuery == null) {
            return false;
        }

        String textChosung = extractChosung(text);
        return textChosung.contains(chosungQuery);
    }

    /**
     * 초성으로만 이루어진 문자열인지 확인
     * 
     * @param text 검사할 문자열
     * @return 초성만 포함하면 true
     */
    public static boolean isChosungOnly(String text) {
        if (text == null || text.isEmpty()) {
            return false;
        }

        for (char ch : text.toCharArray()) {
            boolean isChosung = false;
            for (char cho : CHOSUNG) {
                if (ch == cho) {
                    isChosung = true;
                    break;
                }
            }
            if (!isChosung && ch != ' ') { // 공백은 허용
                return false;
            }
        }
        return true;
    }
}
