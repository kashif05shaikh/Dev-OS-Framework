import { useEffect, useState, useCallback, useRef } from "react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useGlobalSearch } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { BookOpen, Briefcase, FileText, Target, FileBadge, Code2, Loader2, Link as LinkIcon, Search } from "lucide-react";
import { debounce } from "lodash";

export function GlobalSearch({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const debounceSearch = useCallback(
    debounce((q: string) => setDebouncedQuery(q), 300),
    []
  );

  useEffect(() => {
    debounceSearch(query);
    return () => debounceSearch.cancel();
  }, [query, debounceSearch]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [onOpenChange]);

  const { data, isLoading } = useGlobalSearch(
    { q: debouncedQuery },
    { query: { enabled: debouncedQuery.length > 1 } as any }
  );

  const getIcon = (type: string) => {
    switch (type) {
      case "note": return <FileText className="h-4 w-4 text-blue-500" />;
      case "topic": return <BookOpen className="h-4 w-4 text-emerald-500" />;
      case "project": return <Briefcase className="h-4 w-4 text-purple-500" />;
      case "job": return <Target className="h-4 w-4 text-orange-500" />;
      case "resume": return <FileBadge className="h-4 w-4 text-rose-500" />;
      case "prompt": return <Code2 className="h-4 w-4 text-indigo-500" />;
      case "resource": return <LinkIcon className="h-4 w-4 text-teal-500" />;
      default: return <Search className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const handleSelect = (url: string) => {
    onOpenChange(false);
    setLocation(url);
    setQuery("");
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Search notes, learning topics, projects, jobs..." 
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {isLoading && debouncedQuery.length > 1 && (
          <div className="p-4 flex justify-center text-muted-foreground text-sm flex-col items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Searching database...</span>
          </div>
        )}
        
        {!isLoading && debouncedQuery.length > 1 && data?.results.length === 0 && (
          <CommandEmpty>No results found for "{debouncedQuery}".</CommandEmpty>
        )}

        {data?.results && data.results.length > 0 && (
          <CommandGroup heading="Results">
            {data.results.map((item) => (
              <CommandItem 
                key={`${item.type}-${item.id}`}
                value={`${item.type}-${item.id}-${item.title}`}
                onSelect={() => handleSelect(item.url)}
                className="flex items-center gap-3 py-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary border border-border">
                  {getIcon(item.type)}
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-sm leading-none">{item.title}</span>
                  {item.subtitle && (
                    <span className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.subtitle}</span>
                  )}
                </div>
                <div className="ml-auto text-[10px] uppercase tracking-wider font-semibold text-muted-foreground px-2 py-1 bg-secondary rounded-sm border border-border">
                  {item.type}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
