package com.my.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RAGResponse {
    private String response;
    private List<RAGDocument> sources;  // documents → sources

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RAGDocument {
        private String filename;
        private String contentSnippet;
    }
}