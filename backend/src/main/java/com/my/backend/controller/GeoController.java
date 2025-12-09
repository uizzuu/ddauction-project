package com.my.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.my.backend.service.GeoService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/geo")
@RequiredArgsConstructor
public class GeoController {

    private final GeoService geoService;

    @GetMapping("/reverse")
    public ResponseEntity<String> reverseGeocode(
            @RequestParam double latitude,
            @RequestParam double longitude
    ) {
        String address = geoService.reverseGeocode(latitude, longitude);
        return ResponseEntity.ok(address);
    }
}
