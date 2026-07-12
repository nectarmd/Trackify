"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, FolderKanban, X } from "lucide-react";
import type { ProjectWithClient } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

export function ProjectSelect({
  projects,
  value,
  onChange,
  className,
}: {
  projects: ProjectWithClient[];
  value: string | null;
  onChange: (id: string | null) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = projects.find((p) => p.id === value) ?? null;

  const groups = useMemo(() => {
    const filtered = projects.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
    const map = new Map<string, ProjectWithClient[]>();
    for (const p of filtered) {
      const key = p.client?.name ?? "Sem cliente";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [projects, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className={cn(
              "flex items-center gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm hover:bg-accent",
              className
            )}
          />
        }
      >
          {selected ? (
            <>
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: selected.color }}
              />
              <span className="truncate">{selected.name}</span>
            </>
          ) : (
            <>
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Projeto</span>
            </>
          )}
          <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="border-b p-2">
          <Input
            autoFocus
            placeholder="Buscar projeto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Sem projeto</span>
            {value === null && <Check className="ml-auto h-4 w-4" />}
          </button>
          {groups.length === 0 && (
            <p className="px-2 py-4 text-center text-sm text-muted-foreground">
              Nenhum projeto.
            </p>
          )}
          {groups.map(([clientName, items]) => (
            <div key={clientName} className="mt-1">
              <div className="px-2 py-1 text-xs font-semibold uppercase text-muted-foreground">
                {clientName}
              </div>
              {items.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onChange(p.id);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: p.color }}
                  />
                  <span className="truncate">{p.name}</span>
                  {value === p.id && <Check className="ml-auto h-4 w-4" />}
                </button>
              ))}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
