<?php

use Illuminate\Support\Facades\Route;

Route::inertia('/', 'home')->name('home');
Route::inertia('/book', 'booking/index')->name('booking.index');
Route::inertia('/owner/meeting-types', 'owner/meeting-types/index')->name('owner.meeting-types.index');
