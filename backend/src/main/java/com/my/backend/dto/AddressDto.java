package com.my.backend.dto;

import com.my.backend.entity.Address;
import lombok.*;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AddressDto {
    private Long addressId;
    private String address;
    private String zipCode;
    private String detailAddress;

    // Entity → DTO
    public static AddressDto fromEntity(Address address) {
        if (address == null) return null;

        return AddressDto.builder()
                .addressId(address.getAddressId())
                .address(address.getAddress())
                .zipCode(address.getZipCode())
                .detailAddress(address.getDetailAddress())
                .build();
    }

    // DTO → Entity
    public Address toEntity() {
        return Address.builder()
                .addressId(this.addressId)
                .address(this.address)
                .zipCode(this.zipCode)
                .detailAddress(this.detailAddress)
                .build();
    }
}
