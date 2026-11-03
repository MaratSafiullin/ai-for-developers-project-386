<?php

namespace App\Http\Requests\Api\Guest\V1;

use App\Models\MeetingType;
use App\Services\Booking\BookingRules;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * Validates a booking before anything is stored, so invalid data never
 * answers 409. The fields come first, then the meeting type must exist
 * (an unknown type is a field error here, not 404), and only then the
 * start must be a bookable slot start of the type. Whether the slot is
 * still free is left to the unique index on meeting cells (ADR 0002).
 */
class StoreMeetingRequest extends FormRequest
{
    /**
     * The format of `startsAt`: ISO 8601 with a time zone offset.
     */
    private const string STARTS_AT_FORMAT = 'Y-m-d\TH:i:sP';

    private ?MeetingType $meetingType = null;

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'guestName' => ['required', 'string', 'max:100'],
            'meetingTypeId' => ['bail', 'required', 'integer', 'max:2147483647', 'exists:meeting_types,id'],
            'startsAt' => ['required', 'string', 'date_format:'.self::STARTS_AT_FORMAT],
        ];
    }

    /**
     * Get the checks that run after the rules: once the fields are valid,
     * the start must lie in the booking window, on the grid and within the
     * working hours for the duration of the meeting type.
     *
     * @return array<int, callable(Validator): void>
     */
    public function after(BookingRules $rules): array
    {
        return [
            function (Validator $validator) use ($rules): void {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                if (! $rules->isBookableStart($this->startsAt(), $this->meetingType()->duration_minutes)) {
                    $validator->errors()->add('startsAt', __('This time is not available for booking. Choose a slot from the list.'));
                }
            },
        ];
    }

    /**
     * Get the meeting type to book.
     */
    public function meetingType(): MeetingType
    {
        return $this->meetingType ??= MeetingType::query()->findOrFail($this->integer('meetingTypeId'));
    }

    /**
     * Get the requested start of the meeting.
     */
    public function startsAt(): CarbonImmutable
    {
        return CarbonImmutable::createFromFormat(self::STARTS_AT_FORMAT, $this->string('startsAt')->value())
            ?: throw new \UnexpectedValueException('The start was not validated.');
    }

    /**
     * Get the trimmed name of the guest.
     */
    public function guestName(): string
    {
        return $this->string('guestName')->value();
    }
}
