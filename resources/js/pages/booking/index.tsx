import { Head, Link } from '@inertiajs/react';
import { home } from '@/routes';

export default function BookingIndex() {
    return (
        <>
            <Head title="Выберите тип встречи" />
            <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6 text-center text-foreground">
                <h1 className="text-3xl font-semibold">Выберите тип встречи</h1>
                <p className="max-w-md text-muted-foreground">
                    Скоро здесь появится список типов встреч.
                </p>
                <Link
                    href={home()}
                    className="text-primary underline-offset-4 hover:underline"
                >
                    На главную
                </Link>
            </main>
        </>
    );
}
