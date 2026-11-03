import { Head } from '@inertiajs/react';
import { useQuery } from '@tanstack/react-query';
import { listGuestMeetingTypesOptions } from '@/api/@tanstack/react-query.gen';
import { AppLayout } from '@/components/app-layout';
import { MeetingTypeCard } from '@/components/meeting-type-card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

export default function BookingIndex() {
    return (
        <>
            <Head title="Запись на звонок" />
            <AppLayout>
                <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
                    <h1 className="text-3xl font-semibold">Запись на звонок</h1>
                    <section
                        aria-labelledby="meeting-types-heading"
                        className="flex flex-col gap-4"
                    >
                        <h2
                            id="meeting-types-heading"
                            className="text-xl font-medium"
                        >
                            Выберите тип встречи
                        </h2>
                        <MeetingTypeCatalog />
                    </section>
                </main>
            </AppLayout>
        </>
    );
}

function MeetingTypeCatalog() {
    const { data, isPending, isError } = useQuery(
        listGuestMeetingTypesOptions(),
    );

    if (isPending) {
        return <MeetingTypeCatalogSkeleton />;
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
                Пока нет доступных типов встреч.
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

function MeetingTypeCatalogSkeleton() {
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
