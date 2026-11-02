import { Head, Link } from '@inertiajs/react';
import { useQuery } from '@tanstack/react-query';
import { listGuestMeetingTypesOptions } from '@/api/@tanstack/react-query.gen';
import type { MeetingType } from '@/api/types.gen';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { home } from '@/routes';

export default function BookingIndex() {
    return (
        <>
            <Head title="Запись на звонок" />
            <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 bg-background p-6 text-foreground">
                <header className="flex items-center justify-between gap-4">
                    <h1 className="text-3xl font-semibold">Запись на звонок</h1>
                    <Link
                        href={home()}
                        className="text-primary underline-offset-4 hover:underline"
                    >
                        На главную
                    </Link>
                </header>
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

function MeetingTypeCard({ meetingType }: { meetingType: MeetingType }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{meetingType.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                    {meetingType.durationMinutes} мин
                </p>
                {meetingType.description !== null && (
                    <CardDescription>{meetingType.description}</CardDescription>
                )}
            </CardHeader>
        </Card>
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
