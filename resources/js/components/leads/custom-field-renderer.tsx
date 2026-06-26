import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star } from 'lucide-react';

export type LeadFieldDef = {
    id: string;
    section: string;
    label: string;
    key: string;
    type:
        | 'text'
        | 'email'
        | 'phone'
        | 'url'
        | 'number'
        | 'currency'
        | 'date'
        | 'select'
        | 'textarea'
        | 'toggle'
        | 'score';
    options: string[] | null;
    placeholder: string | null;
    required: boolean;
};

type Props = {
    field: LeadFieldDef;
    value: string;
    onChange: (value: string) => void;
    error?: string;
};

export function CustomFieldRenderer({ field, value, onChange, error }: Props) {
    const inputId = `cf_${field.id}`;

    function renderInput() {
        switch (field.type) {
            case 'textarea':
                return (
                    <textarea
                        id={inputId}
                        className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-20 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={field.placeholder ?? ''}
                        required={field.required}
                    />
                );

            case 'select':
                return (
                    <Select value={value} onValueChange={onChange} required={field.required}>
                        <SelectTrigger id={inputId}>
                            <SelectValue placeholder={field.placeholder ?? `Select ${field.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                            {(field.options ?? []).map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                    {opt}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );

            case 'toggle':
                return (
                    <div className="border-border bg-card flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <p className="text-sm font-medium leading-none">{field.label}</p>
                            {field.placeholder && (
                                <p className="text-muted-foreground text-sm">{field.placeholder}</p>
                            )}
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={value === '1' || value === 'true'}
                            onClick={() => onChange(value === '1' || value === 'true' ? '0' : '1')}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                                value === '1' || value === 'true' ? 'bg-primary' : 'bg-input'
                            }`}
                        >
                            <span
                                className={`pointer-events-none inline-block size-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
                                    value === '1' || value === 'true' ? 'translate-x-5' : 'translate-x-0'
                                }`}
                            />
                        </button>
                    </div>
                );

            case 'score': {
                const current = parseInt(value) || 0;
                return (
                    <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => onChange(String(star === current ? 0 : star))}
                                className="focus:outline-none"
                            >
                                <Star
                                    className={`size-6 transition-colors ${
                                        star <= current ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'
                                    }`}
                                />
                            </button>
                        ))}
                        {current > 0 && (
                            <span className="text-muted-foreground ml-1 text-sm">{current} / 5</span>
                        )}
                    </div>
                );
            }

            case 'number':
                return (
                    <Input
                        id={inputId}
                        type="number"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={field.placeholder ?? ''}
                        required={field.required}
                    />
                );

            case 'currency':
                return (
                    <Input
                        id={inputId}
                        type="number"
                        step="0.01"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={field.placeholder ?? '0.00'}
                        required={field.required}
                    />
                );

            case 'date':
                return (
                    <Input
                        id={inputId}
                        type="date"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        required={field.required}
                    />
                );

            case 'email':
                return (
                    <Input
                        id={inputId}
                        type="email"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={field.placeholder ?? ''}
                        required={field.required}
                    />
                );

            case 'phone':
                return (
                    <Input
                        id={inputId}
                        type="tel"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={field.placeholder ?? ''}
                        required={field.required}
                    />
                );

            case 'url':
                return (
                    <Input
                        id={inputId}
                        type="url"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={field.placeholder ?? 'https://'}
                        required={field.required}
                    />
                );

            default:
                return (
                    <Input
                        id={inputId}
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={field.placeholder ?? ''}
                        required={field.required}
                    />
                );
        }
    }

    return (
        <div className="space-y-1">
            {field.type !== 'toggle' && field.type !== 'score' && (
                <Label htmlFor={inputId}>
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
            )}
            {field.type === 'score' && (
                <Label>
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
            )}
            {renderInput()}
            {error && <p className="text-destructive text-xs">{error}</p>}
        </div>
    );
}
