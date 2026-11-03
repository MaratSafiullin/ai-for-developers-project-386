import "@typespec/http";
import "@typespec/openapi";
import "@typespec/json-schema";

using Http;
using OpenAPI;

/**
 * Call calendar: a guest books a call with the owner without signing up.
 */
@service(#{ title: "Call Calendar" })
namespace CallCalendar;

/**
 * Meeting type: a call template with a name, an optional description, and a duration.
 */
model MeetingType {
    id: int32;

    @minLength(1)
    @maxLength(100)
    name: string;

    @maxLength(1000)
    description: string | null;

    @minValue(15)
    @maxValue(240)
    @JsonSchema.multipleOf(15)
    durationMinutes: int32;
}

/**
 * Meeting type catalog in creation order.
 */
model MeetingTypeList {
    data: MeetingType[];
}

/**
 * A single meeting type in a `data` envelope.
 */
model MeetingTypeEnvelope {
    data: MeetingType;
}

/**
 * Data for a new meeting type. An empty description is stored as `null`.
 */
model CreateMeetingTypeRequest {
    ...OmitProperties<MeetingType, "id" | "description">;

    @maxLength(1000)
    description?: string | null;
}

/**
 * Slot: a free interval as long as the meeting type duration.
 * Times are ISO 8601 with the owner's time zone offset.
 */
model Slot {
    startsAt: offsetDateTime;
    endsAt: offsetDateTime;
}

/**
 * A booking window date in the owner's time zone and its free slots in ascending order.
 * Days without free slots come with an empty list.
 */
model SlotDay {
    date: plainDate;
    slots: Slot[];
}

/**
 * Free slots of a meeting type for every date of the booking window.
 */
model SlotCalendar {
    /**
     * Owner's time zone, for example `Europe/Moscow`.
     */
    timezone: string;

    days: SlotDay[];
}

/**
 * Free slots in a `data` envelope.
 */
model SlotCalendarEnvelope {
    data: SlotCalendar;
}

/**
 * Resource not found.
 */
@error
model NotFoundError {
    @statusCode statusCode: 404;
    message: string;
}

/**
 * Invalid data: messages are grouped by request field.
 */
@error
model ValidationError {
    @statusCode statusCode: 422;
    message: string;
    errors: Record<string[]>;
}

/**
 * Guest operations.
 */
@route("/api/guest/v1")
@tag("guest")
namespace Guest {
    /**
     * Meeting type catalog sorted by `id`.
     */
    @route("/meeting-types")
    @get
    @operationId("listGuestMeetingTypes")
    op listMeetingTypes(): MeetingTypeList;

    /**
     * Free slots of a meeting type for the 14 booking window dates, starting tomorrow.
     */
    @route("/slots")
    @get
    @operationId("listGuestSlots")
    op listSlots(@query meetingTypeId: int32):
        | SlotCalendarEnvelope
        | NotFoundError
        | ValidationError;
}

/**
 * Owner operations.
 */
@route("/api/owner/v1")
@tag("owner")
namespace Owner {
    /**
     * Owner's meeting type list sorted by `id`.
     */
    @route("/meeting-types")
    @get
    @operationId("listOwnerMeetingTypes")
    op listMeetingTypes(): MeetingTypeList;

    /**
     * Create a meeting type.
     */
    @route("/meeting-types")
    @post
    @operationId("createOwnerMeetingType")
    op createMeetingType(@body body: CreateMeetingTypeRequest): {
        @statusCode statusCode: 201;
        @body body: MeetingTypeEnvelope;
    } | ValidationError;
}
