import type { MeetingType } from '@/api/types.gen';
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

export function MeetingTypeCard({ meetingType }: { meetingType: MeetingType }) {
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
