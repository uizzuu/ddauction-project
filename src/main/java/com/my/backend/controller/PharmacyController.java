package com.my.backend.controller;


import com.my.backend.entity.Pharmacy;
import com.my.backend.repository.PharmacyRepository;
import com.my.backend.service.KakaoMapService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/pharmacies")
public class PharmacyController {

    private final KakaoMapService kakaoMapService;
    private final PharmacyRepository pharmacyRepository;

    public PharmacyController(KakaoMapService kakaoMapService,
                              PharmacyRepository pharmacyRepository) {
        this.kakaoMapService = kakaoMapService;
        this.pharmacyRepository = pharmacyRepository;
    }

    @GetMapping("/search")
    public List<Pharmacy> searchAndSave(@RequestParam String location) {
        List<Pharmacy> pharmacies = kakaoMapService.searchPharmacies(location, 3);
        pharmacyRepository.saveAll(pharmacies);
        return pharmacies;
    }
}