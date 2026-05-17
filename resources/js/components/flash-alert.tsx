import { Alert, AlertDescription } from '@/components/ui/alert';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';

export default function FlashAlert() {
    const { flash } = usePage<SharedData>().props;

    if (!flash.status) {
        return null;
    }

    return (
        <Alert variant="success">
            <CheckCircle2 className="size-4" />
            <AlertDescription>{flash.status}</AlertDescription>
        </Alert>
    );
}
