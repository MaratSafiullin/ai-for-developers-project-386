import "@typespec/http";
import "@typespec/openapi";
import "@typespec/json-schema";

using Http;
using OpenAPI;

/**
 * Календарь звонков: гость без регистрации записывается на звонок к владельцу.
 */
@service(#{ title: "Календарь звонков" })
namespace CallCalendar;

/**
 * Тип встречи: шаблон звонка с названием, необязательным описанием и длительностью.
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
 * Каталог типов встреч в порядке создания.
 */
model MeetingTypeList {
    data: MeetingType[];
}

/**
 * Операции гостя.
 */
@route("/api/guest/v1")
@tag("guest")
namespace Guest {
    /**
     * Каталог типов встреч, отсортированный по `id`.
     */
    @route("/meeting-types")
    @get
    @operationId("listGuestMeetingTypes")
    op listMeetingTypes(): MeetingTypeList;
}
