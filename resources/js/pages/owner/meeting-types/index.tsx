import { Head } from '@inertiajs/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FormEvent, ReactNode } from 'react';
import { toast } from 'sonner';
import {
    createOwnerMeetingTypeMutation,
    listGuestMeetingTypesQueryKey,
    listOwnerMeetingTypesOptions,
    listOwnerMeetingTypesQueryKey,
} from '@/api/@tanstack/react-query.gen';
import type { ValidationError } from '@/api/types.gen';
import { AppLayout } from '@/layouts/app-layout';
import { MeetingTypeCard } from '@/components/meeting-type-card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

export default function OwnerMeetingTypesIndex() {
    return (
        <>
            <Head title="Типы встреч" />
            <AppLayout>
                <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 p-6">
                    <h1 className="text-3xl font-semibold">Типы встреч</h1>
                    <section
                        aria-labelledby="create-meeting-type-heading"
                        className="flex flex-col gap-4"
                    >
                        <h2
                            id="create-meeting-type-heading"
                            className="text-xl font-medium"
                        >
                            Новый тип встречи
                        </h2>
                        <CreateMeetingTypeForm />
                    </section>
                    <section
                        aria-labelledby="meeting-types-heading"
                        className="flex flex-col gap-4"
                    >
                        <h2
                            id="meeting-types-heading"
                            className="text-xl font-medium"
                        >
                            Ваши типы встреч
                        </h2>
                        <OwnerMeetingTypeList />
                    </section>
                </main>
            </AppLayout>
        </>
    );
}

function isValidationError(error: unknown): error is ValidationError {
    return typeof error === 'object' && error !== null && 'errors' in error;
}

function textField(formData: FormData, name: string): string {
    const value = formData.get(name);

    return typeof value === 'string' ? value : '';
}

function CreateMeetingTypeForm() {
    const queryClient = useQueryClient();
    const { mutate, isPending, error } = useMutation({
        ...createOwnerMeetingTypeMutation(),
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: listOwnerMeetingTypesQueryKey(),
                }),
                queryClient.invalidateQueries({
                    queryKey: listGuestMeetingTypesQueryKey(),
                }),
            ]);
        },
    });

    const fieldErrors = isValidationError(error) ? error.errors : {};

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);

        mutate(
            {
                body: {
                    name: textField(formData, 'name'),
                    description: textField(formData, 'description'),
                    durationMinutes: Number(
                        textField(formData, 'durationMinutes'),
                    ),
                },
            },
            {
                onSuccess: () => {
                    form.reset();
                    toast.success('Тип встречи создан');
                },
            },
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FormField
                id="name"
                label="Название"
                errors={fieldErrors.name}
                control={(describedBy) => (
                    <Input
                        id="name"
                        name="name"
                        required
                        maxLength={100}
                        aria-invalid={describedBy !== undefined}
                        aria-describedby={describedBy}
                    />
                )}
            />
            <FormField
                id="description"
                label="Описание (необязательно)"
                errors={fieldErrors.description}
                control={(describedBy) => (
                    <Textarea
                        id="description"
                        name="description"
                        maxLength={1000}
                        aria-invalid={describedBy !== undefined}
                        aria-describedby={describedBy}
                    />
                )}
            />
            <FormField
                id="durationMinutes"
                label="Длительность, минут"
                errors={fieldErrors.durationMinutes}
                control={(describedBy) => (
                    <Input
                        id="durationMinutes"
                        name="durationMinutes"
                        inputMode="numeric"
                        required
                        aria-invalid={describedBy !== undefined}
                        aria-describedby={describedBy}
                    />
                )}
            />
            {error !== null && !isValidationError(error) && (
                <Alert variant="destructive">
                    <AlertDescription>
                        Не удалось создать тип встречи. Попробуйте ещё раз.
                    </AlertDescription>
                </Alert>
            )}
            <Button type="submit" disabled={isPending} className="self-start">
                {isPending ? 'Создаём…' : 'Создать'}
            </Button>
        </form>
    );
}

function FormField({
    id,
    label,
    errors,
    control,
}: {
    id: string;
    label: string;
    errors: string[] | undefined;
    control: (describedBy: string | undefined) => ReactNode;
}) {
    const errorId = `${id}-error`;
    const hasErrors = errors !== undefined && errors.length > 0;

    return (
        <div className="flex flex-col gap-2">
            <Label htmlFor={id}>{label}</Label>
            {control(hasErrors ? errorId : undefined)}
            {hasErrors && (
                <p id={errorId} className="text-sm text-destructive">
                    {errors.join(' ')}
                </p>
            )}
        </div>
    );
}

function OwnerMeetingTypeList() {
    const { data, isPending, isError } = useQuery(
        listOwnerMeetingTypesOptions(),
    );

    if (isPending) {
        return (
            <div
                className="flex flex-col gap-3"
                aria-busy="true"
                aria-label="Загрузка типов встреч"
            >
                {[0, 1, 2].map((index) => (
                    <Skeleton key={index} className="h-24 w-full" />
                ))}
            </div>
        );
    }

    if (isError) {
        return (
            <Alert variant="destructive">
                <AlertDescription>
                    Не удалось загрузить типы встреч. Обновите страницу.
                </AlertDescription>
            </Alert>
        );
    }

    if (data.data.length === 0) {
        return (
            <p className="text-muted-foreground">
                Типов встреч пока нет. Создайте первый.
            </p>
        );
    }

    return (
        <ul className="flex flex-col gap-3">
            {data.data.map((meetingType) => (
                <li key={meetingType.id}>
                    <MeetingTypeCard meetingType={meetingType} />
                </li>
            ))}
        </ul>
    );
}
