<?php

use App\Http\Controllers\Api\Guest\V1\MeetingTypeController as GuestMeetingTypeController;
use Illuminate\Support\Facades\Route;

Route::prefix('guest/v1')->name('api.guest.v1.')->group(function () {
    Route::get('meeting-types', [GuestMeetingTypeController::class, 'index'])->name('meeting-types.index');
});
