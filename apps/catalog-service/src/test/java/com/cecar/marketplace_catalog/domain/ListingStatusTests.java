package com.cecar.marketplace_catalog.domain;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ListingStatusTests {

    @Test
    void shouldExposeBlockedStatus() {
        assertEquals(ListingStatus.BLOCKED, ListingStatus.valueOf("BLOCKED"));
    }
}
