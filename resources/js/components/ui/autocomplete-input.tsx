import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Check, Search } from 'lucide-react';
import { Input } from './input';
import { Label } from './label';
import { cn } from '@/lib/utils';

type Item = {
    id: number;
    name: string;
};

interface AutocompleteInputProps {
    id: string;
    label: string;
    placeholder?: string;
    searchUrl: string;
    selectedId: number | null;
    searchText: string;
    onSearchTextChange: (text: string) => void;
    onSelect: (item: Item) => void;
    onCreateNew?: (name: string) => void;
    error?: string;
    disabled?: boolean;
    required?: boolean;
    className?: string;
}

export function AutocompleteInput({
    id,
    label,
    placeholder = 'Search...',
    searchUrl,
    selectedId,
    searchText,
    onSearchTextChange,
    onSelect,
    onCreateNew,
    error,
    disabled = false,
    required = false,
    className,
}: AutocompleteInputProps) {
    const [searchResults, setSearchResults] = useState<Item[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleSearch = async (query: string) => {
        onSearchTextChange(query);

        if (query.trim() === '') {
            setSearchResults([]);
            setShowSuggestions(false);
            return;
        }

        setIsSearching(true);
        setShowSuggestions(true);

        try {
            const response = await fetch(`${searchUrl}?q=${encodeURIComponent(query)}`);
            const results = await response.json();
            setSearchResults(results);
        } catch (error) {
            console.error(`Error searching ${label}:`, error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectOption = (item: Item) => {
        onSearchTextChange(item.name);
        onSelect(item);
        setShowSuggestions(false);
        setSearchResults([]);
    };

    const handleCreateOption = () => {
        if (searchText.trim() && onCreateNew) {
            onCreateNew(searchText);
            setShowSuggestions(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        if (showSuggestions) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showSuggestions]);

    return (
        <div className={cn('relative flex flex-col gap-1.5', className)} ref={containerRef}>
            <Label htmlFor={id} className={cn(error && 'text-red-500')}>
                {label} {required && '*'}
            </Label>
            <div className="relative mt-1">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                    {isSearching ? (
                        <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Search className="w-4 h-4" />
                    )}
                </div>
                <Input
                    id={id}
                    placeholder={placeholder}
                    value={searchText}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => searchText && setShowSuggestions(true)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && searchText.trim() && !selectedId && onCreateNew) {
                            e.preventDefault();
                            handleCreateOption();
                        }
                    }}
                    disabled={disabled}
                    className={cn(
                        'pl-10 pr-10',
                        error ? 'border-red-500' : '',
                        selectedId ? 'border-green-500' : ''
                    )}
                />
                {selectedId && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Check className="w-4 h-4 text-green-500" />
                    </div>
                )}
            </div>

            {/* Autocomplete Suggestions */}
            {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-input rounded-md shadow-lg z-50">
                    {isSearching ? (
                        <div className="px-4 py-3 text-sm text-muted-foreground animate-pulse">Searching...</div>
                    ) : searchResults.length > 0 ? (
                        <>
                            <div className="max-h-48 overflow-y-auto">
                                {searchResults.map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => handleSelectOption(item)}
                                        className="w-full text-left px-4 py-2 hover:bg-slate-100 focus:bg-slate-100 focus:outline-none flex items-center justify-between text-sm"
                                    >
                                        <span>{item.name}</span>
                                        <span className="text-xs text-muted-foreground">ID: {item.id}</span>
                                    </button>
                                ))}
                            </div>
                            {onCreateNew && searchText.trim() && !searchResults.find((a) => a.name.toLowerCase() === searchText.toLowerCase()) && (
                                <button
                                    type="button"
                                    onClick={handleCreateOption}
                                    className="w-full text-left px-4 py-2 border-t border-input bg-blue-50 hover:bg-blue-100 focus:bg-blue-100 focus:outline-none text-blue-700 font-medium text-sm"
                                >
                                    + Create new {label.toLowerCase()}: "{searchText}"
                                </button>
                            )}
                        </>
                    ) : onCreateNew && searchText.trim() ? (
                        <button
                            type="button"
                            onClick={handleCreateOption}
                            className="w-full text-left px-4 py-2 bg-blue-50 hover:bg-blue-100 focus:bg-blue-100 focus:outline-none text-blue-700 font-medium text-sm"
                        >
                            + Create new {label.toLowerCase()}: "{searchText}"
                        </button>
                    ) : (
                        <div className="px-4 py-3 text-sm text-muted-foreground">
                            Start typing to search for {label.toLowerCase()}...
                        </div>
                    )}
                </div>
            )}
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}
