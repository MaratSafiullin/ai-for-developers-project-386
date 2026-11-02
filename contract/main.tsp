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
 * Один тип встречи в конверте `data`.
 */
model MeetingTypeEnvelope {
    data: MeetingType;
}

/**
 * Данные нового типа встречи. Пустое описание сохраняется как `null`.
 */
model CreateMeetingTypeRequest {
    ...OmitProperties<MeetingType, "id" | "description">;

    @maxLength(1000)
    description?: string | null;
}

/**
 * Ошибка данных: сообщения сгруппированы по полям запроса.
 */
@error
model ValidationError {
    @statusCode statusCode: 422;
    message: string;
    errors: Record<string[]>;
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

/**
 * Операции владельца.
 */
@route("/api/owner/v1")
@tag("owner")
namespace Owner {
    /**
     * Список типов встреч владельца, отсортированный по `id`.
     */
    @route("/meeting-types")
    @get
    @operationId("listOwnerMeetingTypes")
    op listMeetingTypes(): MeetingTypeList;

    /**
     * Создать тип встречи.
     */
    @route("/meeting-types")
    @post
    @operationId("createOwnerMeetingType")
    op createMeetingType(@body body: CreateMeetingTypeRequest): {
        @statusCode statusCode: 201;
        @body body: MeetingTypeEnvelope;
    } | ValidationError;
}
