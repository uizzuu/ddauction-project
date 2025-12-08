package com.my.backend.controller;

import com.my.backend.service.GeoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/geo")
@RequiredArgsConstructor
public class GeoController {

    private final GeoService geoService;

    @GetMapping("/reverse")
    public ResponseEntity<String> reverseGeocode(
            @RequestParam("latitude") double latitude,
            @RequestParam("longitude") double longitude
    ) {
        String address = geoService.getAddressFromCoords(latitude, longitude);
        return ResponseEntity.ok(address);
    }
}
