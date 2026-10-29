<?php

use Inertia\Testing\AssertableInertia as Assert;

test('booking stub page renders the booking index component', function () {
    $this->get(route('booking.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('booking/index'));
});
